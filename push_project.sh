#!/bin/bash

# Navigate to project directory
cd "/Users/hongocgiahan/LẬP TRÌNH THIẾT BỊ DI ĐỘNG/Iiawak_Project" || exit

echo "=== Bat dau qua trinh khoi tao Git va Push code ==="

# Force remove any existing invalid .git directory to start fresh
if [ -d ".git" ]; then
    echo "Phat hien thu muc .git loi (hoac do tool tao), dang xoa..."
    rm -rf .git
fi

echo "Dang khoi tao repository..."
git init

# Add all files to stage
echo "Dang them file vao Git..."
git add .

# Commit files
echo "Dang commit..."
git commit -m "first commit"

# Rename current branch to main
echo "Dang chuyen nhanh mac dinh thanh main..."
git branch -M main

# Create G.Han branch
echo "Dang tao nhanh G.Han..."
git branch G.Han

# Add remote origin
echo "Dang cau hinh remote origin..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/HanaFS/Iiawak.git

# Push main branch
echo "Dang push nhanh main len Github..."
git push -u origin main

# Push G.Han branch
echo "Dang push nhanh G.Han len Github..."
git push -u origin G.Han

echo "=== Hoan thanh! ==="
read -p "Nhan Enter de thoat..."
