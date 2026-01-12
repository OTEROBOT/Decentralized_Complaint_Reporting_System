// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ComplaintSystem {
    address public admin;
    uint public complaintCount;

    constructor() {
        admin = msg.sender;
    }

    enum Status { Submitted, UnderReview, Resolved }

    struct Complaint {
        uint id;
        address reporter;
        string title;
        string description;
        Status status;
        uint timestamp;
    }

    mapping(uint => Complaint) public complaints;
    mapping(address => bool) public officers;

    // Modifier ควบคุมสิทธิ์
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this");
        _;
    }

    modifier onlyOfficer() {
        require(officers[msg.sender], "Only officer can call this");
        _;
    }

    // เพิ่มเจ้าหน้าที่ (Admin เท่านั้น)
    function addOfficer(address _officer) public onlyAdmin {
        officers[_officer] = true;
    }

    // ผู้ร้องเรียนส่งเรื่องร้องเรียน
    function submitComplaint(string memory _title, string memory _description) public {
        complaintCount++;
        complaints[complaintCount] = Complaint({
            id: complaintCount,
            reporter: msg.sender,
            title: _title,
            description: _description,
            status: Status.Submitted,
            timestamp: block.timestamp
        });
    }

    // เจ้าหน้าที่อัปเดตสถานะ (ต้องมี require ให้ id ถูกต้อง)
    function updateStatus(uint _id, Status _status) public onlyOfficer {
        require(_id > 0 && _id <= complaintCount, "Invalid complaint ID");
        complaints[_id].status = _status;
    }

    // ดูข้อมูลเรื่องร้องเรียน (ทุกคนดูได้ แต่ต้องมี id ถูกต้อง)
    function getComplaint(uint _id) public view returns (Complaint memory) {
        require(_id > 0 && _id <= complaintCount, "Invalid complaint ID");
        return complaints[_id];
    }
}