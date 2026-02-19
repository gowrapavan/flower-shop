import os

# Define the perfect project structure
# 'data' goes in Root. Everything else goes in 'src'.
structure = {
    # --- ROOT LEVEL (Database) ---
    "data": [
        ("products.json", "[]"),
        ("users.json", "[]"),
        ("categories.json", "[]")
    ],

    # --- SRC LEVEL (Code) ---
    "src/types": [
        ("index.ts", "// TypeScript Interfaces")
    ],
    
    "src/lib": [
        ("db.ts", "// Database Logic"),
        ("auth.ts", "// Authentication Logic"),
        ("utils.ts", "// Utility Functions")
    ],
    
    "src/context": [
        ("CartContext.tsx", "// Cart Context Provider")
    ],
    
    "src/components/layout": [
        ("Header.tsx", "// Sticky Header Component"),
        ("Footer.tsx", "// Footer Component")
    ],
    
    "src/components/product": [
        ("ProductCard.tsx", "// Grid Item Card"),
        ("ProductGallery.tsx", "// Image Gallery for Details"),
        ("ProductTabs.tsx", "// Description & Review Tabs")
    ],
    
    "src/components/ui": [
        ("Button.tsx", "// Reusable UI Button")
    ],

    # --- APP ROUTER PAGES ---
    "src/app/shop": [
        ("page.tsx", "// Main Shop Page")
    ],
    
    "src/app/product/[id]": [
        ("page.tsx", "// Product Detail Page")
    ],
    
    "src/app/account": [
        ("page.tsx", "// User Account Page")
    ],
    
    "src/app/cart": [
        ("page.tsx", "// Cart Page")
    ],

    # --- API ROUTES ---
    "src/app/api/products": [
        ("route.ts", "// API: Get Products")
    ],
    
    "src/app/api/auth/login": [
        ("route.ts", "// API: Login User")
    ],
    
    "src/app/api/auth/register": [
        ("route.ts", "// API: Register User")
    ]
}

def create_project_structure():
    print("🚀 Starting Project Scaffolding for 'src/' directory...")
    base_path = os.getcwd()

    for folder, files in structure.items():
        # Create the folder path
        full_folder_path = os.path.join(base_path, folder)
        
        try:
            os.makedirs(full_folder_path, exist_ok=True)
            print(f"✅ Folder: {folder}")
        except Exception as e:
            print(f"❌ Error creating folder {folder}: {e}")
            continue

        # Create the files inside the folder
        for filename, initial_content in files:
            file_path = os.path.join(full_folder_path, filename)
            
            # Only create if it doesn't exist (to prevent overwriting work)
            if not os.path.exists(file_path):
                try:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(initial_content)
                    print(f"   📄 Created: {filename}")
                except Exception as e:
                    print(f"   ❌ Error creating file {filename}: {e}")
            else:
                print(f"   ⚠️ Skipped (already exists): {filename}")

    print("\n✨ Scaffolding Complete! You can now start copy-pasting code.")

if __name__ == "__main__":
    create_project_structure()