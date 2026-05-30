import os

def compile_migrations():
    m_dir = r"c:\GitHub\COGNARA\supabase\migrations"
    out_f = r"c:\GitHub\COGNARA\supabase\supabase_schema.sql"
    
    files = sorted([f for f in os.listdir(m_dir) if f.endswith(".sql")])
    combined_content = []
    
    for f in files:
        path = os.path.join(m_dir, f)
        print(f"Adding {f}...")
        combined_content.append(f"-- ================================================================\n-- MIGRATION: {f}\n-- ================================================================\n")
        with open(path, "r", encoding="utf-8") as file:
            combined_content.append(file.read())
        combined_content.append("\n\n")
        
    with open(out_f, "w", encoding="utf-8") as file:
        file.write("".join(combined_content))
        
    print(f"Successfully compiled {len(files)} migrations into {out_f}")

if __name__ == "__main__":
    compile_migrations()
