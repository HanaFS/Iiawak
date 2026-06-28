#!/bin/bash
echo "Running git commands..."
git reset --soft HEAD~1
git rm --cached Iiawak_backend/.env
git add .
git commit -m "Sửa lỗi lộ API Key và cập nhật gitignore"
git push origin G.Han:G.Han
echo "Done!"
