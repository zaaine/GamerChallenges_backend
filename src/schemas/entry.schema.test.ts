import { entrySchema } from "./entry.schema.js"

// ============================================================
// TESTS DU SCHEMA D'ENTRÉE (entrySchema)
// ============================================================

describe("entrySchema", () => {
  // Données valides de base réutilisées dans les tests
  const validData = {
    title: "Mon super challenge",
    video_url: "https://www.youtube.com/watch?v=123456",
    user_id: 1,
    challenge_id: 1,
  }

  // -- CAS VALIDES --

  it("accepte des données d'entrée complètes et valides", () => {
    const result = entrySchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  // -- CAS INVALIDES : TITLE --

  it("refuse un titre de moins de 3 caractères", () => {
    const result = entrySchema.safeParse({ ...validData, title: "ab" })
    expect(result.success).toBe(false)
  })

  it("refuse un titre vide", () => {
    const result = entrySchema.safeParse({ ...validData, title: "" })
    expect(result.success).toBe(false)
  })

  it("refuse si le titre est absent", () => {
    const { title, ...withoutTitle } = validData
    const result = entrySchema.safeParse(withoutTitle)
    expect(result.success).toBe(false)
  })

  // -- CAS INVALIDES : VIDEO_URL --

  it("refuse une video_url de moins de 10 caractères", () => {
    const result = entrySchema.safeParse({ ...validData, video_url: "http://" })
    expect(result.success).toBe(false)
  })

  it("refuse une video_url contenant une balise <script>", () => {
    const result = entrySchema.safeParse({
      ...validData,
      video_url: "<script>alert('xss')</script>",
    })
    expect(result.success).toBe(false)
  })

  it("refuse une video_url avec une balise script avec attributs", () => {
    const result = entrySchema.safeParse({
      ...validData,
      video_url: '<script type="text/javascript">alert("xss")</script>',
    })
    expect(result.success).toBe(false)
  })

  it("refuse si la video_url est absente", () => {
    const { video_url, ...withoutVideoUrl } = validData
    const result = entrySchema.safeParse(withoutVideoUrl)
    expect(result.success).toBe(false)
  })

  // -- CAS INVALIDES : USER_ID --

  it("refuse un user_id qui n'est pas un nombre", () => {
    const result = entrySchema.safeParse({ ...validData, user_id: "abc" })
    expect(result.success).toBe(false)
  })

  it("refuse si user_id est absent", () => {
    const { user_id, ...withoutUserId } = validData
    const result = entrySchema.safeParse(withoutUserId)
    expect(result.success).toBe(false)
  })

  // -- CAS INVALIDES : CHALLENGE_ID --

  it("refuse un challenge_id qui n'est pas un nombre", () => {
    const result = entrySchema.safeParse({ ...validData, challenge_id: "abc" })
    expect(result.success).toBe(false)
  })

  it("refuse si challenge_id est absent", () => {
    const { challenge_id, ...withoutChallengeId } = validData
    const result = entrySchema.safeParse(withoutChallengeId)
    expect(result.success).toBe(false)
  })
})