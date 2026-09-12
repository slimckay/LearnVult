# LearnVult architecture

```
Device -> React frontend -> IndexedDB (offline)
                         -> FastAPI backend when online
                         -> SQLite now / PostgreSQL later
```

Peer-to-peer sharing is a later sprint: device to nearby device over local Wi-Fi.
