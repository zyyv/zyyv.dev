import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import ts from 'typescript'
const root = fileURLToPath(new URL('../', import.meta.url))
let code = ts.transpileModule(readFileSync(root + 'server/utils/photos.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext },
}).outputText
code = code
  .replaceAll(
    '#shared/constants/photo-reactions',
    pathToFileURL(root + 'shared/constants/photo-reactions.ts').href,
  )
  .replaceAll('#shared/constants/images', pathToFileURL(root + 'shared/constants/images.ts').href)
const { listPublicPhotos } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
)
const db = new DatabaseSync(':memory:')
for (const name of [
  '0001_create_photos.sql',
  '0002_create_photo_reactions.sql',
  '0003_allow_multiple_photo_reactions.sql',
  '0007_add_photo_media_type.sql',
])
  db.exec(readFileSync(root + 'migrations/' + name, 'utf8'))
const insert = db.prepare(
  `INSERT INTO photos(id,filename,origin_key,origin_size,compressed_key,compressed_size,thumbnail_key,thumbnail_size,width,height,blurhash,is_private,created_at,modified_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
)
const react = db.prepare(
  "INSERT INTO photo_reactions(photo_id,visitor_id,reaction,created_at,updated_at) VALUES(?,?,'like',?,?)",
)
for (let i = 0; i < 105; i++) {
  const id = String(i).padStart(3, '0'),
    date = '2026-09-05'
  insert.run(
    id,
    id,
    id + '-o',
    1024,
    id + '-c',
    512,
    id + '-t',
    256,
    100,
    100,
    '',
    i >= 100 ? 1 : 0,
    date,
    date,
  )
  for (let j = 0; j < 3; j++) react.run(id, 'v' + j, date, date)
}
let batches = []
const adapter = {
  prepare(sql) {
    return {
      sql,
      args: [],
      bind(...args) {
        return { ...this, args }
      },
    }
  },
  async batch(statements) {
    const result = statements.map((s) => ({ results: db.prepare(s.sql).all(...s.args) }))
    batches = result.map((r) => r.results.length)
    return result
  },
}
const all = await listPublicPhotos(adapter)
assert.equal(all.total, 100)
assert.equal(all.photos.length, 100)
assert.ok(all.photos.every((x) => !x.private && x.reactions.like === 3))
for (const offset of [0, 24, 96, 120]) {
  const page = await listPublicPhotos(adapter, { limit: 24, offset })
  assert.equal(page.total, 100)
  assert.deepEqual(page.photos, all.photos.slice(offset, offset + 24))
  assert.ok(batches[0] <= 24 && batches[1] <= 24)
}
db.exec('DELETE FROM photo_reactions; DELETE FROM photos')
assert.deepEqual(await listPublicPhotos(adapter, { limit: 24, offset: 0 }), {
  photos: [],
  total: 0,
})
console.log(
  'PASS: actual SQL, stable ordering, private exclusion, reaction counts, page boundaries, empty database, bounded results',
)
db.close()
