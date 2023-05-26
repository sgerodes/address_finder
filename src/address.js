const ethers = require('ethers');
const crypto = require('crypto');
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet').hdkey;
const fs = require('fs');
const readline = require('readline');


const processName = process.argv[2];
console.log(`Process name: ${processName}`);
const folderName = "data/" + (processName ?  + processName + "/" : "default/");
if (!fs.existsSync(folderName)){
    fs.mkdirSync(folderName, { recursive: true });
}

const NUM_CHAR_IN_ROW = 7;
const NUM_CHAR_IN_ROW_STARTS = 5;
const COUNT_THRESHOLD = 100;
const OCCURRENCES_THRESHOLD = 4;
const FILE_TO_WRITE = `${folderName}bobs.txt`;
const PERFORMANCE_FILE = `${folderName}performance.txt`;

var regex_contains = new RegExp(`(\\w)\\1{${NUM_CHAR_IN_ROW - 1}}`);
var regex_starts = new RegExp(`^(\\w)\\1{${NUM_CHAR_IN_ROW_STARTS - 1}}`);


//const starters = ['beef', 'decaff', 'facade', 'decaf', 'cafe', 'face', 'ace', 'bad', 'ba0bab', 'caca0', 'c0ffee', 'dec0de', 'f00d']
const starters = ['decaff', 'facade', 'decaf', 'ba0bab', 'caca0', 'c0ffee', 'dec0de']
const starters2 = ['b0bbeef', 'b0bdecaff', 'b0bfacade', 'b0bdecaf', 'b0bcafe',
    'b0bface', 'b0bace', 'aceb0b', 'b0bbad', 'badb0b', 'caca0b0b', 'c0ffeeb0b',
    'b0bc0ffee', 'b0bdec0de', 'b0bf00d', 'b0b0b', 'b0bb0b']
const starters_all = starters.concat(starters2);


function createWallet() {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic);

    const hdWallet = hdkey.fromMasterSeed(seed);
    const wallet = hdWallet.derivePath("m/44'/60'/0'/0/0").getWallet();
    //const address = `0x${wallet.getAddress().toString('hex')}`;
    const address_blank = wallet.getAddress().toString('hex');
    const privateKey = wallet.getPrivateKeyString();

    return {
        address_blank: address_blank,
        privateKey: privateKey,
        mnemonic: mnemonic
    };
}

async function readWordsFromFile(inputPath) {
    const fileStream = fs.createReadStream(inputPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    const words = [];
    for await (const line of rl) {
        words.push(line.trim());
    }
    return words;
}

function writeWordsToFile(words, outputPath) {
    // Convert the Set back to an Array for easy manipulation
    const uniqueWords = Array.from(words);

    // Join the words with a newline character and write to the output file
    fs.writeFile(outputPath, uniqueWords.join('\n'), (err) => {
        if (err) throw err;
        console.log('The file has been saved with unique words!');
    });
}

function maxCharInRow(s) {
    if (s.length === 0) return 0;

    let maxCount = 0;
    let currentCount = 1;
    let currentChar = s[0];

    for (let i = 1; i < s.length; i++) {
        if (s[i] === currentChar) {
            currentCount++;
        } else {
            if (currentCount > maxCount) {
                maxCount = currentCount;
            }
            currentChar = s[i];
            currentCount = 1;
        }
    }

    // check for the case where the maximum sequence ends at the end of the string
    if (currentCount > maxCount) {
        maxCount = currentCount;
    }

    return maxCount;
}

function appendToFile(filePath, str) {
    fs.appendFileSync(filePath, str + '\n', (err) => {
        if (err) throw err;
    });
}

function logAndAppend(filePath, str) {
    console.log(str);
    appendToFile(filePath, str)
}


function countOccurrences(string) {
    const regex = /b0b/gi; // Regular expression to match "b0b" case-insensitively
    const matches = string.match(regex);

    if (matches) {
        return matches.length;
    } else {
        return 0;
    }
}


function isInteresting(address_blank) {
    if (address_blank.startsWith('b0b') && address_blank.endsWith('b0b')) {
        logAndAppend(FILE_TO_WRITE, 'Starts and ends with b0b')
        return true;
    }
    for (const starter of starters_all) {
        if (address_blank.startsWith(starter) || address_blank.endsWith(starter)) {
            logAndAppend(FILE_TO_WRITE, `Starts or ends with ${starter}`)
            return true;
        }
    }
    if (countOccurrences(address_blank) >= OCCURRENCES_THRESHOLD) {
        logAndAppend(FILE_TO_WRITE, `Contains b0b at least ${OCCURRENCES_THRESHOLD} times`)
        return true;
    }
    if (regex_contains.test(address_blank)) {
        const count = maxCharInRow(address_blank);
        logAndAppend(FILE_TO_WRITE, `Contains ${count} of the same character in a row`);
        return true;
    }
    if (regex_starts.test(address_blank)) {
        const count = maxCharInRow(address_blank);
        logAndAppend(FILE_TO_WRITE, `Starts with ${count} of the same character in a row`)
        return true;
    }
    return false;
}


function checkAddressForWords() {
    let count = 0;
    let startTime = new Date();
    while (true) {
        count += 1;
        if (count % COUNT_THRESHOLD == 0) {
            let currentTime = new Date();
            let elapsedTime = (currentTime - startTime) / 1000;
            let throughput = COUNT_THRESHOLD / elapsedTime;
            logAndAppend(PERFORMANCE_FILE, `count=${count}, throughput=${throughput.toFixed(2)} addresses/sec`);
            startTime = new Date();
        }
        const wallet = createWallet();
        const { address_blank, privateKey, mnemonic } = wallet;

        if (isInteresting(address_blank)) {
            logAndAppend(FILE_TO_WRITE, `Address: ${address_blank}, Private Key: ${privateKey}, Mnemonic: ${mnemonic}`)
        }

    }
}

async function main() {
    //const words = await readWordsFromFile('public/all.txt');
    //const lowercaseWordsSet = new Set(words.map(word => word.toLowerCase()).filter(word => word.length > 4));
    //console.log(lowercaseWordsSet);
    checkAddressForWords();
}


main().catch(error => console.error(error));
