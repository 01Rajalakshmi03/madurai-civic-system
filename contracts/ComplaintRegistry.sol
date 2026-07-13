// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ComplaintRegistry {
    address public owner;
    uint256 public complaintCount;

    enum Status { Filed, Assigned, InProgress, Resolved, Rejected }

    struct Complaint {
        uint256 id;
        string complaintId;
        string description;
        string category;
        string location;
        string ward;
        uint256 timestamp;
        Status status;
        address assignedOfficer;
        bytes32 complaintHash;
        bool exists;
    }

    mapping(uint256 => Complaint) public complaints;
    mapping(string => uint256) public complaintIdToIndex;
    mapping(address => uint256[]) public officerComplaints;

    event ComplaintCreated(
        uint256 indexed id,
        string complaintId,
        string category,
        string location,
        uint256 timestamp
    );

    event ComplaintUpdated(
        uint256 indexed id,
        string complaintId,
        Status status,
        address assignedOfficer,
        uint256 timestamp
    );

    event ComplaintVerified(
        uint256 indexed id,
        string complaintId,
        bool verified,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
        complaintCount = 0;
    }

    function registerComplaint(
        string memory _complaintId,
        string memory _description,
        string memory _category,
        string memory _location,
        string memory _ward
    ) public returns (uint256) {
        require(complaintIdToIndex[_complaintId] == 0, "Complaint already exists");

        complaintCount++;
        uint256 newId = complaintCount;

        bytes32 hash = keccak256(
            abi.encodePacked(
                _complaintId,
                _description,
                _category,
                _location,
                _ward,
                block.timestamp,
                msg.sender
            )
        );

        complaints[newId] = Complaint({
            id: newId,
            complaintId: _complaintId,
            description: _description,
            category: _category,
            location: _location,
            ward: _ward,
            timestamp: block.timestamp,
            status: Status.Filed,
            assignedOfficer: address(0),
            complaintHash: hash,
            exists: true
        });

        complaintIdToIndex[_complaintId] = newId;

        emit ComplaintCreated(newId, _complaintId, _category, _location, block.timestamp);
        return newId;
    }

    function updateComplaintStatus(
        string memory _complaintId,
        uint8 _status,
        address _officer
    ) public onlyOwner returns (bool) {
        uint256 index = complaintIdToIndex[_complaintId];
        require(index > 0, "Complaint not found");
        require(_status >= 0 && _status <= 4, "Invalid status");

        Complaint storage complaint = complaints[index];
        complaint.status = Status(_status);
        complaint.assignedOfficer = _officer;

        if (_officer != address(0)) {
            officerComplaints[_officer].push(index);
        }

        emit ComplaintUpdated(index, _complaintId, Status(_status), _officer, block.timestamp);
        return true;
    }

    function verifyComplaint(string memory _complaintId) public view returns (bool, bytes32, uint256, Status) {
        uint256 index = complaintIdToIndex[_complaintId];
        require(index > 0, "Complaint not found");

        Complaint storage complaint = complaints[index];
        return (true, complaint.complaintHash, complaint.timestamp, complaint.status);
    }

    function getComplaint(string memory _complaintId)
        public
        view
        returns (
            uint256,
            string memory,
            string memory,
            string memory,
            uint256,
            Status,
            address,
            bytes32
        )
    {
        uint256 index = complaintIdToIndex[_complaintId];
        require(index > 0, "Complaint not found");

        Complaint storage c = complaints[index];
        return (
            c.id,
            c.category,
            c.location,
            c.ward,
            c.timestamp,
            c.status,
            c.assignedOfficer,
            c.complaintHash
        );
    }

    function getComplaintCount() public view returns (uint256) {
        return complaintCount;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
}
