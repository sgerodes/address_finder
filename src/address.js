const ethers = require('ethers');
const crypto = require('crypto');
const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet').hdkey;
const fs = require('fs');
const readline = require('readline');

function createWallet() {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic);

    const hdWallet = hdkey.fromMasterSeed(seed);
    const wallet = hdWallet.derivePath("m/44'/60'/0'/0/0").getWallet();
    const address = `0x${wallet.getAddress().toString('hex')}`;
    const privateKey = wallet.getPrivateKeyString();

    return {
        address: address,
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



function countOccurrences(string) {
    const regex = /b0b/gi; // Regular expression to match "b0b" case-insensitively
    const matches = string.match(regex);

    if (matches) {
        return matches.length;
    } else {
        return 0;
    }
}

const COUNT_THRESHOLD = 10000;
const OCCURRENCES_THRESHOLD = 2;

function checkAddressForWords(lowercaseWordsSet) {
    let count = 0;
    let startTime = new Date();
    while (true) {
        count += 1;
        if (count % COUNT_THRESHOLD == 0) {
            let currentTime = new Date();
            let elapsedTime = (currentTime - startTime) / 1000;
            let throughput = COUNT_THRESHOLD / elapsedTime;
            console.log(`count=${count}, throughput=${throughput.toFixed(2)} addresses/sec`);
            startTime = new Date();
        }
        const wallet = createWallet();
        const { address, privateKey, mnemonic } = wallet;
        const startsWith = address.substring(2).startsWith('b0b')
        const endsWith = address.endsWith('b0b')
        if (!startsWith && !endsWith) {
            continue
        }
        const occurrences = countOccurrences(address)
        if (occurrences >= OCCURRENCES_THRESHOLD) {
            console.log(`${startsWith?'startsWith, ':''}${endsWith?'endsWith, ':''}b0b x ${occurrences}, Address: ${address}, Private Key: ${privateKey}, Mnemonic: ${mnemonic}`);
        }

        // for (const word of lowercaseWordsSet) {
        //
        //     //if (address.includes(word)) {
        //     if (address.includes('b0b')) {
        //         console.log(`word: ${word}, Address: ${address}, Private Key: ${privateKey}, Mnemonic: ${mnemonic}`);
        //     }
        // }
    }
}

async function main() {
    const words = await readWordsFromFile('public/all.txt');
    const lowercaseWordsSet = new Set(words.map(word => word.toLowerCase()).filter(word => word.length > 4));
    //console.log(lowercaseWordsSet);
    checkAddressForWords(lowercaseWordsSet);
}


main().catch(error => console.error(error));
