#!/bin/bash

# Navigate to project directory
cd "/Users/hongocgiahan/LẬP TRÌNH THIẾT BỊ DI ĐỘNG/Iiawak_Project" || exit

echo "=== Bat dau day toan bo project len nhanh MAIN ==="

# Force remove any existing invalid .git directory to start fresh
if [ ! -d ".git" ]; then
    echo "Dang khoi tao repository..."
    git init
    git remote add origin https://github.com/HanaFS/Iiawak.git
fi

# Add all files to stage
echo "Dang them file vao Git..."
git add .

# Commit files
echo "Dang commit..."
git commit -m "push all to main"

# Rename current branch to main
echo "Dang chuyen nhanh mac dinh thanh main..."
git branch -M main

# Push main branch forcefully if needed (to ensure everything on main is updated)
echo "Dang push toan bo code len nhanh main..."
git push -u origin main --force

echo "=== Hoan thanh! ==="
