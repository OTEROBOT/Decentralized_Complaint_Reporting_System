// SPDX-License-Identifier: MIT
// ระบุประเภทของ License สำหรับ Smart Contract นี้ (ในที่นี้คือ MIT)
pragma solidity ^0.8.20; 
// กำหนดเวอร์ชันของภาษา Solidity ที่ใช้เขียน (ใช้เวอร์ชัน 0.8.20 ขึ้นไป)

/**
 * @title ComplaintSystem
 * @dev ระบบจัดการเรื่องร้องเรียนบน Blockchain
 * ระบบนี้ช่วยให้ผู้ใช้สามารถแจ้งเรื่องร้องเรียน ระบุสถานที่ และมีเจ้าหน้าที่ (Officer)
 * เข้ามาจัดการตามพื้นที่ที่ตนเองได้รับมอบหมาย โดยมี Admin เป็นผู้ควบคุมภาพรวม
 */
contract ComplaintSystem {
    
    // --- State Variables (ตัวแปรเก็บข้อมูลบน Blockchain) ---

    // เก็บ Address ของผู้ดูแลระบบสูงสุด (คนที่ Deploy Contract นี้)
    address public admin;

    // ตัวนับจำนวนเรื่องร้องเรียนทั้งหมด เพื่อใช้เป็น ID ให้กับแต่ละ Complaint
    uint public complaintCount;

    // ฟังก์ชันสร้าง Contract (ทำงานครั้งแรกและครั้งเดียวตอน Deploy)
    constructor() {
        // กำหนดให้คนที่ Deploy Contract นี้เป็น Admin
        admin = msg.sender;
    }

    // กำหนดสถานะต่างๆ ของเรื่องร้องเรียน
    // Submitted = ส่งเรื่องแล้ว, UnderReview = กำลังตรวจสอบ, Resolved = แก้ไขแล้ว
    // Reopened = เปิดเรื่องใหม่ (กรณีผู้แจ้งไม่พอใจ), Closed = ปิดเรื่องสมบูรณ์
    enum Status { Submitted, UnderReview, Resolved, Reopened, Closed }

    // โครงสร้างข้อมูลสำหรับ 1 เรื่องร้องเรียน
    struct Complaint {
        uint id;                // รหัสประจำเรื่องร้องเรียน
        address reporter;       // Address ของผู้ที่แจ้งเรื่องเข้ามา
        string title;           // หัวข้อเรื่อง
        string description;     // รายละเอียดเนื้อหาของปัญหา
        string location;        // สถานที่ที่เกิดเหตุ (ใช้สำหรับคัดกรองเจ้าหน้าที่)
        address officerAssigned; // Address ของเจ้าหน้าที่ที่รับผิดชอบเรื่องนี้
        string actionRequired;  // สิ่งที่เจ้าหน้าที่ระบุว่าต้องทำเพื่อแก้ไข
        Status status;          // สถานะปัจจุบันของเรื่อง
        uint timestamp;         // เวลาที่ทำการส่งเรื่อง (Block Timestamp)
    }

    // เก็บข้อมูล Complaint ทั้งหมด โดยใช้ ID (uint) เป็น Key ในการค้นหา
    mapping(uint => Complaint) public complaints;

    // เก็บสถานะว่า Address ใดบ้างที่เป็นเจ้าหน้าที่ (Officer)
    mapping(address => bool) public officers;

    // เก็บรายชื่อเจ้าหน้าที่ประจำแต่ละสถานที่ (1 สถานที่อาจมีเจ้าหน้าที่หลายคน)
    // Key คือชื่อสถานที่ (String) และ Value คือ Array ของ Address เจ้าหน้าที่
    mapping(string => address[]) public locationOfficers;

    // --- Modifiers (เงื่อนไขการเข้าถึงฟังก์ชัน) ---

    // ตรวจสอบว่าผู้ที่เรียกใช้งานฟังก์ชันต้องเป็น Admin เท่านั้น
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _; // ไปทำงานในตัวฟังก์ชันต่อไป
    }

    // ตรวจสอบว่าผู้ที่เรียกใช้งานฟังก์ชันต้องอยู่ในรายชื่อเจ้าหน้าที่ (Officers)
    modifier onlyOfficer() {
        require(officers[msg.sender], "Only officer can call this");
        _;
    }

    // ตรวจสอบว่าผู้ที่เรียกใช้งานต้องเป็นคนเดียวกับคนที่ส่งเรื่องร้องเรียน ID นั้นๆ เท่านั้น
    modifier onlyReporter(uint _id) {
        require(msg.sender == complaints[_id].reporter, "Only reporter can call this");
        _;
    }

    // --- Administrative Functions (ส่วนของ Admin) ---

    /**
     * @dev เพิ่ม Address เข้าไปในระบบให้มีสิทธิ์เป็นเจ้าหน้าที่ (Officer)
     * เฉพาะ Admin เท่านั้นที่ทำได้
     */
    function addOfficer(address _officer) public onlyAdmin {
        officers[_officer] = true;
    }

    /**
     * @dev ผูกเจ้าหน้าที่เข้ากับพื้นที่ที่รับผิดชอบ
     * เจ้าหน้าที่จะสามารถรับงานได้เฉพาะในพื้นที่ที่ตนเองมีชื่ออยู่ใน Array เท่านั้น
     */
    function assignOfficerToLocation(string memory _location, address _officer) public onlyAdmin {
        locationOfficers[_location].push(_officer);
    }

    // --- Internal Logic / View Functions ---

    /**
     * @dev ตรวจสอบว่าเจ้าหน้าที่คนนี้มีสิทธิ์ในพื้นที่ดังกล่าวหรือไม่
     * ทำการวน Loop เช็คจากรายชื่อเจ้าหน้าที่ในพื้นที่นั้นๆ
     */
    function isOfficerOfLocation(address _officer, string memory _location) public view returns (bool) {
        address[] memory officersList = locationOfficers[_location];
        for (uint i = 0; i < officersList.length; i++) {
            if (officersList[i] == _officer) return true;
        }
        return false;
    }

    // --- User Actions (ส่วนของประชาชน/ผู้แจ้ง) ---

    /**
     * @dev ผู้ใช้ทั่วไปส่งเรื่องร้องเรียนใหม่
     * ระบบจะบันทึกข้อมูลและตั้งสถานะเริ่มต้นเป็น Submitted
     */
    function submitComplaint(string memory _title, string memory _description, string memory _location) public {
        complaintCount++; // เพิ่มจำนวน ID ลำดับถัดไป
        complaints[complaintCount] = Complaint({
            id: complaintCount,
            reporter: msg.sender,
            title: _title,
            description: _description,
            location: _location,
            officerAssigned: address(0), // ยังไม่มีเจ้าหน้าที่รับงาน (เป็น 0x0...)
            actionRequired: "",
            status: Status.Submitted,
            timestamp: block.timestamp
        });
    }

    // --- Officer Actions (ส่วนของเจ้าหน้าที่) ---

    /**
     * @dev เจ้าหน้าที่เลือกกดรับเรื่องที่ยังไม่มีใครทำ (Claim)
     * ต้องเป็นเจ้าหน้าที่ที่มีสิทธิ์ในเขตพื้นที่นั้น และเรื่องต้องอยู่ในสถานะ Submitted เท่านั้น
     */
    function assignToOfficer(uint _id) public onlyOfficer {
        Complaint storage complaint = complaints[_id];
        require(_id > 0 && _id <= complaintCount, "Invalid ID"); // ตรวจสอบว่า ID มีจริง
        require(complaint.status == Status.Submitted, "Can only assign to submitted complaints");
        require(isOfficerOfLocation(msg.sender, complaint.location), "Only officer of this location can assign");
        require(complaint.officerAssigned == address(0), "Already assigned"); // ป้องกันการรับงานซ้ำ

        complaint.officerAssigned = msg.sender; // บันทึกชื่อเจ้าหน้าที่ผู้รับงาน
        complaint.status = Status.UnderReview; // เปลี่ยนสถานะเป็นกำลังดำเนินการ
    }

    /**
     * @dev เจ้าหน้าที่บันทึกแนวทางการแก้ไข หรือระบุว่าต้องทำอะไรบ้าง
     * ผู้ที่เป็นคนรับเรื่องไปเท่านั้นถึงจะแก้ไขข้อมูลส่วนนี้ได้
     */
    function setActionRequired(uint _id, string memory _action) public onlyOfficer {
        Complaint storage complaint = complaints[_id];
        require(_id > 0 && _id <= complaintCount, "Invalid ID");
        require(complaint.officerAssigned == msg.sender, "Only assigned officer can set action");
        require(complaint.status == Status.UnderReview, "Can only set action under review");
        complaint.actionRequired = _action;
    }

    /**
     * @dev เจ้าหน้าที่ทำเครื่องหมายว่า "แก้ไขเสร็จแล้ว"
     * เพื่อรอให้ประชาชน (Reporter) มาตรวจสอบและยืนยัน
     */
    function markAsResolved(uint _id) public onlyOfficer {
        Complaint storage complaint = complaints[_id];
        require(_id > 0 && _id <= complaintCount, "Invalid ID");
        require(complaint.officerAssigned == msg.sender, "Only assigned officer can resolve");
        require(complaint.status == Status.UnderReview, "Can only resolve under review");
        complaint.status = Status.Resolved;
    }

    // --- Feedback & Closing (ส่วนของผู้แจ้งตรวจทาน) ---

    /**
     * @dev ผู้แจ้งกดยืนยันว่าปัญหาได้รับการแก้ไขแล้วจริงๆ
     * เรื่องจะเปลี่ยนสถานะเป็น Closed (จบเรื่องสมบูรณ์)
     */
    function confirmResolution(uint _id) public onlyReporter(_id) {
        Complaint storage complaint = complaints[_id];
        require(_id > 0 && _id <= complaintCount, "Invalid ID");
        require(complaint.status == Status.Resolved, "Can only confirm resolved complaints");
        complaint.status = Status.Closed;
    }

    /**
     * @dev หากผู้แจ้งไม่พอใจผลการแก้ไข สามารถกดปฏิเสธได้
     * ระบบจะ Reopened เรื่องกลับมาใหม่ และเอาชื่อเจ้าหน้าที่เดิมออก
     * เพื่อเปิดโอกาสให้เจ้าหน้าที่คนเดิมหรือคนใหม่ในเขตนั้นกดรับไปทำต่อ
     */
    function rejectResolution(uint _id) public onlyReporter(_id) {
        Complaint storage complaint = complaints[_id];
        require(_id > 0 && _id <= complaintCount, "Invalid ID");
        require(complaint.status == Status.Resolved, "Can only reject resolved complaints");
        complaint.status = Status.Reopened;
        complaint.officerAssigned = address(0); // ล้างชื่อเจ้าหน้าที่เพื่อให้รับเรื่องใหม่ได้
    }

    // --- Query Functions (ฟังก์ชันสำหรับดึงข้อมูลไปแสดงผล) ---

    /**
     * @dev ดูรายละเอียดทั้งหมดของเรื่องร้องเรียน 1 รายการ โดยใส่ ID
     */
    function getComplaint(uint _id) public view returns (Complaint memory) {
        require(_id > 0 && _id <= complaintCount, "Invalid complaint ID");
        return complaints[_id];
    }

    /**
     * @dev ดึงรายชื่อ Address เจ้าหน้าที่ทั้งหมดที่ดูแลพื้นที่ที่ระบุ
     * มีประโยชน์มากสำหรับ Frontend ในการแสดงผลว่าเขตนี้ใครดูแลบ้าง
     */
    function getOfficersOfLocation(string memory _location) public view returns (address[] memory) {
        return locationOfficers[_location];
    }
}