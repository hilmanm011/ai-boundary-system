# Dokumen Requirements

## Pendahuluan

Fitur AI Content Pipeline adalah sistem pipeline generasi konten berbasis AI dengan alur persetujuan draft. Sistem ini memungkinkan user untuk meminta AI menghasilkan konten berdasarkan knowledge base, menyimpan hasilnya sebagai draft, lalu melalui proses approval sebelum dipublikasikan. AI hanya boleh menulis ke draft — publikasi hanya terjadi melalui endpoint approve yang dikontrol oleh user.

## Glossary

- **Pipeline**: Sistem end-to-end yang menangani alur dari request AI hingga publikasi konten
- **Draft**: Konten yang dihasilkan AI dan disimpan dengan status "draft", belum dipublikasikan
- **Published_Content**: Konten yang sudah disetujui dan dipublikasikan ke tabel utama
- **Knowledge_Source**: Sumber pengetahuan (Notion, manual, dsb.) yang digunakan sebagai konteks untuk AI
- **LLM_Client**: Komponen yang memanggil Large Language Model melalui OpenRouter API
- **Draft_Manager**: Komponen yang mengelola lifecycle draft (create, list, approve, reject)
- **Content_Generator**: Komponen yang mengambil knowledge, membangun konteks, dan memanggil LLM untuk menghasilkan konten
- **Audit_Log**: Catatan aktivitas yang merekam setiap perubahan status dan aksi pada draft
- **State_Transition**: Perubahan status draft yang mengikuti aturan: draft → approved, draft → rejected (satu arah, tidak bisa balik)

## Requirements

### Requirement 1: Generasi Konten AI

**User Story:** Sebagai user, saya ingin meminta AI menghasilkan konten berdasarkan knowledge base, sehingga saya mendapatkan draft konten yang relevan dan kontekstual.

#### Acceptance Criteria

1. WHEN user mengirim request ke endpoint POST /ai/generate dengan prompt, THE Content_Generator SHALL mengambil knowledge sources yang relevan dari tabel knowledge_sources
2. WHEN knowledge sources berhasil diambil, THE Content_Generator SHALL membangun konteks dari knowledge sources dan menyertakannya dalam pemanggilan LLM
3. WHEN LLM menghasilkan respons, THE Draft_Manager SHALL menyimpan konten ke tabel ai_drafts dengan status "draft"
4. THE Draft_Manager SHALL menyimpan metadata lengkap pada draft meliputi: prompt asli, context yang dibangun, references ke knowledge sources, dan created_by (user ID)
5. IF LLM gagal menghasilkan respons, THEN THE Content_Generator SHALL mengembalikan error message yang deskriptif dengan HTTP status 502
6. IF prompt kosong atau tidak valid, THEN THE Content_Generator SHALL mengembalikan error validasi dengan HTTP status 400

### Requirement 2: Controlled Write Boundary

**User Story:** Sebagai system architect, saya ingin memastikan AI hanya bisa menulis ke draft, sehingga tidak ada konten AI yang langsung masuk ke data utama tanpa persetujuan manusia.

#### Acceptance Criteria

1. THE Content_Generator SHALL menyimpan semua output AI hanya ke tabel ai_drafts, bukan ke tabel published_content
2. WHEN konten AI disimpan, THE Draft_Manager SHALL menetapkan status awal sebagai "draft"
3. THE Pipeline SHALL memastikan tidak ada jalur kode yang memungkinkan AI menulis langsung ke tabel published_content

### Requirement 3: Daftar Draft

**User Story:** Sebagai user, saya ingin melihat semua draft yang dihasilkan AI, sehingga saya bisa memilih draft mana yang akan di-approve atau di-reject.

#### Acceptance Criteria

1. WHEN user mengirim request ke endpoint GET /ai/drafts, THE Draft_Manager SHALL mengembalikan daftar semua draft dari tabel ai_drafts
2. THE Draft_Manager SHALL menyertakan semua field pada setiap draft: id, content, prompt, context, references, status, created_by, dan created_at
3. IF tidak ada draft yang ditemukan, THEN THE Draft_Manager SHALL mengembalikan array kosong dengan HTTP status 200

### Requirement 4: Approve Draft

**User Story:** Sebagai user, saya ingin meng-approve draft, sehingga konten yang sudah disetujui dipublikasikan ke data utama.

#### Acceptance Criteria

1. WHEN user mengirim request ke endpoint POST /ai/drafts/:id/approve, THE Draft_Manager SHALL memverifikasi bahwa draft dengan ID tersebut ada di database
2. WHEN draft ditemukan, THE Draft_Manager SHALL memverifikasi bahwa status draft masih "draft"
3. WHEN status draft valid ("draft"), THE Draft_Manager SHALL menjalankan operasi berikut dalam satu database transaction: insert konten ke tabel published_content dan update status draft menjadi "approved"
4. WHEN draft berhasil di-approve, THE Draft_Manager SHALL menyimpan published_by (user ID) dan published_at (timestamp) pada record published_content
5. IF draft tidak ditemukan, THEN THE Draft_Manager SHALL mengembalikan error dengan HTTP status 404
6. IF status draft bukan "draft" (sudah approved atau rejected), THEN THE Draft_Manager SHALL mengembalikan error dengan HTTP status 409 (Conflict)

### Requirement 5: Reject Draft

**User Story:** Sebagai user, saya ingin me-reject draft yang tidak sesuai, sehingga draft tersebut ditandai sebagai ditolak dan tidak bisa di-approve lagi.

#### Acceptance Criteria

1. WHEN user mengirim request ke endpoint POST /ai/drafts/:id/reject, THE Draft_Manager SHALL memverifikasi bahwa draft dengan ID tersebut ada di database
2. WHEN draft ditemukan, THE Draft_Manager SHALL memverifikasi bahwa status draft masih "draft"
3. WHEN status draft valid ("draft"), THE Draft_Manager SHALL mengubah status draft menjadi "rejected"
4. IF draft tidak ditemukan, THEN THE Draft_Manager SHALL mengembalikan error dengan HTTP status 404
5. IF status draft bukan "draft" (sudah approved atau rejected), THEN THE Draft_Manager SHALL mengembalikan error dengan HTTP status 409 (Conflict)

### Requirement 6: State Transition yang Ketat

**User Story:** Sebagai system architect, saya ingin memastikan transisi status draft mengikuti aturan yang ketat, sehingga integritas data terjaga.

#### Acceptance Criteria

1. THE Draft_Manager SHALL hanya mengizinkan transisi status berikut: "draft" → "approved" dan "draft" → "rejected"
2. THE Draft_Manager SHALL menolak transisi dari "approved" ke status lain
3. THE Draft_Manager SHALL menolak transisi dari "rejected" ke status lain
4. WHEN transisi status tidak valid diminta, THE Draft_Manager SHALL mengembalikan error dengan HTTP status 409 dan pesan yang menjelaskan bahwa draft sudah diproses

### Requirement 7: Idempotency pada Approve dan Reject

**User Story:** Sebagai developer, saya ingin operasi approve dan reject bersifat idempotent-safe, sehingga request duplikat tidak menyebabkan data inkonsisten.

#### Acceptance Criteria

1. WHEN user mengirim approve untuk draft yang sudah berstatus "approved", THE Draft_Manager SHALL mengembalikan error 409 tanpa mengubah data apapun
2. WHEN user mengirim reject untuk draft yang sudah berstatus "rejected", THE Draft_Manager SHALL mengembalikan error 409 tanpa mengubah data apapun
3. WHEN user mengirim approve untuk draft yang sudah berstatus "rejected", THE Draft_Manager SHALL mengembalikan error 409 tanpa mengubah data apapun
4. THE Draft_Manager SHALL memastikan tidak ada duplikasi record di tabel published_content untuk draft yang sama

### Requirement 8: Transaction Safety

**User Story:** Sebagai developer, saya ingin operasi approve menggunakan database transaction, sehingga data tetap konsisten jika terjadi kegagalan di tengah proses.

#### Acceptance Criteria

1. WHEN operasi approve dijalankan, THE Draft_Manager SHALL membungkus insert ke published_content dan update status ai_drafts dalam satu database transaction
2. IF insert ke published_content gagal, THEN THE Draft_Manager SHALL melakukan rollback dan status draft tetap "draft"
3. IF update status ai_drafts gagal, THEN THE Draft_Manager SHALL melakukan rollback dan record published_content tidak tersimpan
4. WHEN transaction gagal, THE Draft_Manager SHALL mengembalikan error dengan HTTP status 500 dan pesan yang menjelaskan kegagalan

### Requirement 9: Audit Log

**User Story:** Sebagai admin, saya ingin setiap aksi pada draft tercatat dalam audit log, sehingga saya bisa melacak siapa melakukan apa dan kapan.

#### Acceptance Criteria

1. WHEN draft baru dibuat, THE Pipeline SHALL mencatat log dengan informasi: action "created", draft_id, user_id, dan timestamp
2. WHEN draft di-approve, THE Pipeline SHALL mencatat log dengan informasi: action "approved", draft_id, user_id, dan timestamp
3. WHEN draft di-reject, THE Pipeline SHALL mencatat log dengan informasi: action "rejected", draft_id, user_id, dan timestamp
4. THE Pipeline SHALL menyimpan audit log secara persisten (console log atau tabel database)

### Requirement 10: Metadata Tracking

**User Story:** Sebagai user, saya ingin setiap draft menyimpan metadata lengkap tentang proses generasi, sehingga saya bisa memahami konteks dan sumber konten yang dihasilkan.

#### Acceptance Criteria

1. THE Draft_Manager SHALL menyimpan prompt asli yang dikirim user pada field prompt di tabel ai_drafts
2. THE Draft_Manager SHALL menyimpan konteks yang dibangun dari knowledge sources pada field context (JSON) di tabel ai_drafts
3. THE Draft_Manager SHALL menyimpan daftar referensi knowledge sources yang digunakan pada field references (JSON) di tabel ai_drafts
4. THE Draft_Manager SHALL menyimpan user ID pembuat pada field created_by di tabel ai_drafts
5. THE Draft_Manager SHALL menyimpan timestamp pembuatan pada field created_at di tabel ai_drafts

### Requirement 11: Knowledge Sources Management

**User Story:** Sebagai user, saya ingin sistem memiliki tabel knowledge sources, sehingga AI bisa mengambil konteks yang relevan saat menghasilkan konten.

#### Acceptance Criteria

1. THE Pipeline SHALL menyediakan tabel knowledge_sources dengan field: id (UUID), title (text), content (text), source_type (varchar), dan created_at (timestamp)
2. WHEN Content_Generator memproses request generasi, THE Content_Generator SHALL mengambil knowledge sources dari tabel knowledge_sources
3. THE Content_Generator SHALL menyertakan source_type sebagai bagian dari metadata references pada draft

### Requirement 12: Validasi Input dengan Zod

**User Story:** Sebagai developer, saya ingin semua input API divalidasi menggunakan Zod, sehingga data yang masuk ke sistem selalu valid dan tipe-nya aman.

#### Acceptance Criteria

1. WHEN request masuk ke endpoint POST /ai/generate, THE Pipeline SHALL memvalidasi body request menggunakan Zod schema (prompt wajib string non-kosong, userId wajib string)
2. WHEN request masuk ke endpoint POST /ai/drafts/:id/approve, THE Pipeline SHALL memvalidasi parameter id sebagai UUID yang valid dan body berisi userId
3. WHEN request masuk ke endpoint POST /ai/drafts/:id/reject, THE Pipeline SHALL memvalidasi parameter id sebagai UUID yang valid dan body berisi userId
4. IF validasi gagal, THEN THE Pipeline SHALL mengembalikan error dengan HTTP status 400 dan detail field yang tidak valid
