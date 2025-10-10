# Backend

Node.js + TypeScript

- API REST/GraphQL para consultas empresariales/financieras.
- Integración con MongoDB y motor de vectores.
- Pipeline de ingestión de datos (APIs externas, scraping).
- Procesamiento estadístico y generación de informes.
- Personalización por contexto conversacional.

## Segun la libreria oficial de mongo la conexion a la bd es asi en python

```python
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

uri = "mongodb+srv://root:<db_password>@clustertest1.vf2aggf.mongodb.net/?retryWrites=true&w=majority&appName=ClusterTest1"

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
```
