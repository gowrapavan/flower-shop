import os

# Define the folder structure and files to create
structure = {
    "data": [
        ("products.json", "[]"),
        ("users.json", "[]"),
        ("categories.json", "[]")
    ],
    "types": [
        ("index.ts", "// Define your TypeScript interfaces here (Product, User, etc.)")
    ],
    "lib": [
        ("db.ts", "// JSON Database logic here"),
        ("auth.ts", "// JWT Authentication logic here"),
        ("utils.ts", "// Helper functions")
    ],
    "context": [
        ("CartContext.tsx", "// Cart State Management Context")
    ],
    "components/layout": [
        ("Header.tsx", "// Header Component"),
        ("Footer.tsx", "// Footer Component")
    ],
    "components/product": [
        ("ProductCard.tsx", "// Product Card Component"),
        ("ProductGallery.tsx", "// Product Image Gallery"),
        ("ProductTabs.tsx", "// Description/Reviews Tabs")
    ],
    "components/ui": [
        ("Button.tsx", "// Reusable Button Component")
    ],
    "app/shop": [
        ("page.tsx", "// Shop / Category Page")
    ],
    "app/product/[id]": [
        ("page.tsx", "// Product Detail Page")
    ],
    "app/api/products": [
        ("route.ts", "// API Route for getting products")
    ],
    "app/api/auth/login": [
        ("route.ts", "// API Route for Login")
    ],
    "app/api/auth/register": [
        ("route.ts", "// API Route for Registration")
    ],
    "app/account": [
        ("page.tsx", "// User Account Page")
    ]
}

def create_structure():
    print("🚀 Starting project scaffolding...")
    
    for folder, files in structure.items():
        # Create the directory if it doesn't exist
        try:
            os.makedirs(folder, exist_ok=True)
            print(f"✅ Created folder: {folder}")
        except Exception as e:
            print(f"❌ Error creating folder {folder}: {e}")
            continue

        # Create files within the directory
        for filename, content in files:
            file_path = os.path.join(folder, filename)
            
            # Only create if it doesn't exist to avoid overwriting work
            if not os.path.exists(file_path):
                try:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"   📄 Created file: {file_path}")
                except Exception as e:
                    print(f"   ❌ Error writing file {file_path}: {e}")
            else:
                print(f"   ⚠️ Skipped (already exists): {file_path}")

    print("\n✨ Scaffolding complete! You can now copy-paste your code.")

if __name__ == "__main__":
    create_structure()