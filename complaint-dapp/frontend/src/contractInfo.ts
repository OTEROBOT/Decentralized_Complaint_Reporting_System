// src/contractInfo.ts
/**
 * ============================================================
 * ไฟล์: contractInfo.ts
 * หน้าที่: เก็บข้อมูลสำคัญสำหรับการเชื่อมต่อกับ Smart Contract บน Blockchain
 * ประกอบด้วย 2 ส่วนหลักคือ Address (ที่อยู่) และ ABI (อินเตอร์เฟซการใช้งาน)
 * ============================================================
 */

/**
 * 1. CONTRACT_ADDRESS
 * คือ "ที่อยู่" ของสัญญาฉบับนี้บนเครือข่าย Blockchain (เช่น Sepolia, Mainnet)
 * เปรียบเสมือน URL ของเว็บไซต์ หรือเลขที่บัญชีธนาคาร 
 * หากเปลี่ยน Contract ใหม่ (Redeploy) ต้องนำ Address ใหม่มาวางที่นี่เสมอ
 */
export const CONTRACT_ADDRESS = "0x378a2b5eDd836239a30C5E52215530e8c45a2Bcb";

/**
 * 2. CONTRACT_ABI (Application Binary Interface)
 * คือ "คู่มือการสั่งงาน" ในรูปแบบ JSON 
 * ซึ่งบอกว่า Contract นี้มีฟังก์ชันอะไรให้เรียกใช้บ้าง, ต้องส่งค่าอะไรเข้าไป (Inputs), 
 * และจะได้ค่าอะไรกลับมา (Outputs) 
 * หากไม่มี ABI หน้าเว็บของเราจะไม่สามารถสื่อสารกับฟังก์ชันใน Smart Contract ได้เลย
 */
export const CONTRACT_ABI = 
  [
    // ฟังก์ชัน: addOfficer 
    // ใช้สำหรับให้ Admin เพิ่มรายชื่อเจ้าหน้าที่เข้าสู่ระบบ
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_officer", // รับค่าเป็น Address ของเจ้าหน้าที่คนใหม่
                "type": "address"
            }
        ],
        "name": "addOfficer",
        "outputs": [],
        "stateMutability": "nonpayable", // ต้องมีการส่ง Transaction และเสียค่า Gas (เพราะมีการเขียนข้อมูล)
        "type": "function"
    },
    // ฟังก์ชัน: assignOfficerToLocation
    // ใช้ผูกเจ้าหน้าที่เข้ากับพื้นที่ที่รับผิดชอบ (Location)
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_location", // ชื่อสถานที่ (String)
                "type": "string"
            },
            {
                "internalType": "address",
                "name": "_officer", // Address ของเจ้าหน้าที่
                "type": "address"
            }
        ],
        "name": "assignOfficerToLocation",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // ฟังก์ชัน: assignToOfficer
    // ให้เจ้าหน้าที่กด "รับเรื่อง" ร้องเรียน (Claim) ตาม ID ที่ระบุ
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_id", // ID ของเรื่องร้องเรียน
                "type": "uint256"
            }
        ],
        "name": "assignToOfficer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // ฟังก์ชัน: confirmResolution
    // ผู้ร้องเรียนกดยืนยันว่าการแก้ไขเสร็จสิ้นแล้ว (ปิดเรื่อง)
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_id",
                "type": "uint256"
            }
        ],
        "name": "confirmResolution",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // ฟังก์ชัน: markAsResolved
    // เจ้าหน้าที่แจ้งว่าได้ทำการแก้ไขเรื่องร้องเรียนนี้เสร็จแล้ว
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_id",
                "type": "uint256"
            }
        ],
        "name": "markAsResolved",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // ฟังก์ชัน: rejectResolution
    // ผู้ร้องเรียนไม่พอใจผลการแก้ไข และขอเปิดเรื่องใหม่อีกครั้ง
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_id",
                "type": "uint256"
            }
        ],
        "name": "rejectResolution",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // ฟังก์ชัน: setActionRequired
    // เจ้าหน้าที่ระบุรายละเอียดว่าต้องทำอะไรบ้างเพื่อแก้ไขปัญหานี้
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_id",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_action", // ข้อความรายละเอียดสิ่งที่ต้องทำ
                "type": "string"
            }
        ],
        "name": "setActionRequired",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // ฟังก์ชัน: submitComplaint
    // ผู้ใช้ทั่วไปส่งเรื่องร้องเรียนใหม่เข้าสู่ระบบ
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_title",       // หัวข้อเรื่อง
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_description", // รายละเอียดปัญหา
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_location",    // สถานที่เกิดเหตุ
                "type": "string"
            }
        ],
        "name": "submitComplaint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // Constructor
    // ทำงานตอนที่ Deploy Contract ครั้งแรก
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    // ฟังก์ชัน (Getter): admin
    // ใช้ตรวจสอบว่าใครคือผู้ดูแลระบบ (Admin)
    {
        "inputs": [],
        "name": "admin",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view", // view คืออ่านข้อมูลอย่างเดียว ไม่เสียค่า Gas
        "type": "function"
    },
    // ฟังก์ชัน (Getter): complaintCount
    // ใช้ดึงจำนวนเรื่องร้องเรียนทั้งหมดที่มีในระบบ
    {
        "inputs": [],
        "name": "complaintCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // ฟังก์ชัน (Getter): complaints
    // ใช้ดึงข้อมูลเบื้องต้นของเรื่องร้องเรียนรายอันจาก Mapping โดยใส่ ID
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "complaints",
        "outputs": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "address", "name": "reporter", "type": "address" },
            { "internalType": "string", "name": "title", "type": "string" },
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "string", "name": "location", "type": "string" },
            { "internalType": "address", "name": "officerAssigned", "type": "address" },
            { "internalType": "string", "name": "actionRequired", "type": "string" },
            { "internalType": "enum ComplaintSystem.Status", "name": "status", "type": "uint8" },
            { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // ฟังก์ชัน: getComplaint
    // ใช้ดึงข้อมูล Complaint ทั้งหมดแบบครบถ้วนในรูปแบบ Struct (Tuple)
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_id",
                "type": "uint256"
            }
        ],
        "name": "getComplaint",
        "outputs": [
            {
                "components": [
                    { "internalType": "uint256", "name": "id", "type": "uint256" },
                    { "internalType": "address", "name": "reporter", "type": "address" },
                    { "internalType": "string", "name": "title", "type": "string" },
                    { "internalType": "string", "name": "description", "type": "string" },
                    { "internalType": "string", "name": "location", "type": "string" },
                    { "internalType": "address", "name": "officerAssigned", "type": "address" },
                    { "internalType": "string", "name": "actionRequired", "type": "string" },
                    { "internalType": "enum ComplaintSystem.Status", "name": "status", "type": "uint8" },
                    { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
                ],
                "internalType": "struct ComplaintSystem.Complaint",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // ฟังก์ชัน: getOfficersOfLocation
    // ใช้ดึงรายชื่อเจ้าหน้าที่ทั้งหมดที่ดูแลสถานที่นั้นๆ ออกมาเป็น Array
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_location",
                "type": "string"
            }
        ],
        "name": "getOfficersOfLocation",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // ฟังก์ชัน: isOfficerOfLocation
    // ใช้เช็คว่า Address นี้ เป็นเจ้าหน้าที่ของสถานที่นี้จริงหรือไม่ (คืนค่า True/False)
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_officer",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "_location",
                "type": "string"
            }
        ],
        "name": "isOfficerOfLocation",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // ฟังก์ชัน (Getter): locationOfficers
    // ใช้เข้าถึงข้อมูลเจ้าหน้าที่รายคนใน Array ของสถานที่นั้นๆ (Mapping 2 ชั้น)
    {
        "inputs": [
            { "internalType": "string", "name": "", "type": "string" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "name": "locationOfficers",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // ฟังก์ชัน (Getter): officers
    // ใช้ตรวจสอบว่า Address ที่ระบุมีสิทธิ์เป็นเจ้าหน้าที่ (Officer) หรือไม่
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "officers",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];