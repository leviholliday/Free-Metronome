#!/bin/bash

echo "🚀 Preparing Professional Metronome for Netlify deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    echo "✅ Git repository initialized"
else
    echo "📁 Git repository already exists"
fi

# Add all files
echo "📝 Adding files to Git..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Update: Professional Metronome ready for Netlify deployment"
    echo "✅ Changes committed"
fi

# Set main branch if not already set
if git branch --show-current | grep -q "main"; then
    echo "🌿 Already on main branch"
else
    echo "🌿 Switching to main branch..."
    git branch -M main
    echo "✅ Switched to main branch"
fi

echo ""
echo "🎯 Next steps for Netlify deployment:"
echo "1. Create a repository on GitHub/GitLab/Bitbucket"
echo "2. Add your remote origin: git remote add origin <your-repo-url>"
echo "3. Push to remote: git push -u origin main"
echo "4. Go to Netlify and connect your repository"
echo "5. Deploy automatically!"
echo ""
echo "📁 Your project is now ready for deployment!"
echo "📖 Check README.md for detailed instructions"
