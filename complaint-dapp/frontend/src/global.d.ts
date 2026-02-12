/** * ============================================================
 * ไฟล์: global.d.ts
 * หน้าที่: การทำ "Global Type Declaration" 
 * อธิบายง่ายๆ: ปกติแล้ว TypeScript จะไม่รู้จักว่า Window.ethereum คืออะไร 
 * เพราะมันไม่ใช่มาตรฐานของ Web Browser ทั่วไป แต่ถูกฉีด (Inject) เข้ามาโดย Wallet
 * ไฟล์นี้เลยมีหน้าที่บอก TypeScript ว่า "เฮ้ย ถ้าเจอ .ethereum ใน window ไม่ต้องด่านะ ข้ารู้จักมัน!"
 * ============================================================
 */

// นำเข้าเฉพาะ "ประเภทข้อมูล" (Type) ที่ชื่อว่า Eip1193Provider จาก Library 'ethers'
// การใช้ 'import type' จะไม่กินพื้นที่ในไฟล์ที่ Build ออกมา เพราะใช้แค่ตอนเช็ค Error ใน Code Editor เท่านั้น
import type { Eip1193Provider } from 'ethers'

/**
 * ใน TypeScript ไฟล์ที่มีการ 'import' หรือ 'export' จะถูกมองว่าเป็น Module
 * การใส่ 'export {}' ว่างๆ ไว้แบบนี้ เป็นเทคนิคเพื่อให้ไฟล์นี้ถูกนับว่าเป็น Module
 * ซึ่งจำเป็นต่อการใช้งานคำสั่ง 'declare global' ด้านล่าง
 */
export {}

// 'declare global' คือการประกาศสิ่งที่อยู่นอกเหนือขอบเขตของโปรเจกต์เรา (Global Scope)
declare global {
  
  /**
   * เรากำลังทำการ "Merge" หรือรวมนิยามใหม่เข้าไปใน Interface 'Window' เดิมที่มีอยู่แล้ว
   * เพื่อให้เวลาเราพิมพ์ `window.ethereum` ในไฟล์อื่นๆ ของโปรเจกต์
   * ตัว Editor (เช่น VS Code) จะได้ขึ้น Auto-complete และไม่โชว์เส้นแดง Error
   */
  interface Window {
    
    // ประกาศว่าใน window อาจจะมี (Optional '?') property ที่ชื่อว่า 'ethereum'
    // ซึ่งจะมีคุณลักษณะ (Type) ตามมาตรฐาน Eip1193Provider 
    // (เป็นมาตรฐานสากลของกระเป๋าเงินคริปโตที่คุยกับ Browser ได้)
    ethereum?: Eip1193Provider
  }
}

/**
 * สรุปประโยชน์ของไฟล์นี้:
 * 1. ป้องกัน Error "Property 'ethereum' does not exist on type 'Window & typeof globalThis'"
 * 2. ช่วยให้เราเขียนโค้ดได้ง่ายขึ้น เพราะ TypeScript จะรู้ว่าใน ethereum มีฟังก์ชันอะไรให้เรียกบ้าง (เช่น .request())
 * 3. เป็นการตั้งค่าพื้นฐานที่สำคัญมากสำหรับแอปพลิเคชัน dApp (Decentralized Application)
 */