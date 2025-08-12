print("🧪 Teste simples de configuração...")

# Teste 1: Importações básicas
try:
    import pymysql
    print("✅ PyMySQL OK")
except ImportError:
    print("❌ PyMySQL não encontrado")

try:
    import sqlalchemy
    print("✅ SQLAlchemy OK")
except ImportError:
    print("❌ SQLAlchemy não encontrado")

# Teste 2: Configurações
try:
    import env as env_config
    print("✅ env.py encontrado")
    print(f"   Host: {env_config.DB_HOST}")
    print(f"   User: {env_config.DB_USER}")
    print(f"   DB: {env_config.DB_NAME}")
    
    # Teste 3: Conexão básica
    connection = pymysql.connect(
        host=env_config.DB_HOST,
        user=env_config.DB_USER,
        password=env_config.DB_PASSWORD,
        port=int(env_config.DB_PORT),
        charset='utf8mb4'
    )
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1 as test")
        result = cursor.fetchone()
        print(f"✅ Conexão MySQL OK: {result}")
    
    connection.close()
    
except Exception as e:
    print(f"❌ Erro: {e}")

print("🏁 Teste concluído")
