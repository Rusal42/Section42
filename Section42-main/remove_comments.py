import os
import re

def remove_comments_from_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        if not re.match(r'^\s*//', line):
            new_lines.append(line)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root:
            continue
        
        for file in files:
            if file.endswith('.js'):
                file_path = os.path.join(root, file)
                print(f"Processing: {file_path}")
                remove_comments_from_js(file_path)

if __name__ == "__main__":
    bot_dir = r"c:\Users\adens\Downloads\Bots\Section42"
    process_directory(bot_dir)
    print("Done! All comments removed.")
