from collections import defaultdict
import os

data_folders = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

lines = []
for folder in data_folders:
    file_path = f'./data/{folder}/bobs.txt'
    dir_path = os.path.dirname(file_path)

    if os.path.exists(dir_path):
        with open(f'./data/{folder}/bobs.txt', 'r') as bobs_file:
            lines += bobs_file.readlines()
        print(f'Files read from: {dir_path}')
    else:
        print(f'Path does not exists: {dir_path}')


cause_2_address = defaultdict(list)
bob_cause_2_address = defaultdict(list)

for i in range(0, len(lines), 2):
    cause = lines[i].strip()
    address = lines[i+1].strip() if i+1 < len(lines) else None

    if 'b0b' in cause:
        bob_cause_2_address[cause].append(address)
    else:
        cause_2_address[cause].append(address)

with open('./data/bobs_sorted.txt', 'w') as bobs_sorted_file:
    for cause, addresses in bob_cause_2_address.items():
        for a in addresses:
            bobs_sorted_file.write(f'{cause}\n{a}\n')
        bobs_sorted_file.write('\n')
    for cause, addresses in cause_2_address.items():
        for a in addresses:
            bobs_sorted_file.write(f'{cause}\n{a}\n')
        bobs_sorted_file.write('\n')
