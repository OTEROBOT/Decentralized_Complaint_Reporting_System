import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractInfo'
import './App.css'

interface Complaint {
  id: number;
  title: string;
  description: string;
  location: string;
  reporter: string;
  officerAssigned: string;
  actionRequired: string;
  status: string;
  timestamp: string;
  expanded?: boolean;
}

function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [isOfficer, setIsOfficer] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [newOfficerAddress, setNewOfficerAddress] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [showMyComplaintsOnly, setShowMyComplaintsOnly] = useState(false)
  const [actionInput, setActionInput] = useState('')

  const locations = [
    "เทศบาลนครอุดรธานี",
    "โรงพยาบาลอุดรธานี",
    "สถานีตำรวจภูธรเมืองอุดรธานี",
    "สำนักงานสาธารณสุขจังหวัดอุดรธานี",
    "สำนักงานที่ดินจังหวัดอุดรธานี",
    "สำนักงานเขตพื้นที่การศึกษาประถมศึกษาอุดรธานี เขต 1",
    "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาอุดรธานี เขต 20",
    "สำนักงานประกันสังคมจังหวัดอุดรธานี",
    "สำนักงานโยธาธิการและผังเมืองจังหวัดอุดรธานี",
    "สำนักงานสรรพากรพื้นที่อุดรธานี",
    "สำนักงานอุตสาหกรรมจังหวัดอุดรธานี",
    "สำนักงานการท่องเที่ยวและกีฬาจังหวัดอุดรธานี",
    "สำนักงานพาณิชย์จังหวัดอุดรธานี",
    "สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดอุดรธานี",
    "สำนักงานเกษตรและสหกรณ์จังหวัดอุดรธานี",
    "สำนักงานทรัพยากรธรรมชาติและสิ่งแวดล้อมจังหวัดอุดรธานี",
    "สำนักงานแรงงานจังหวัดอุดรธานี",
    "สำนักงานปศุสัตว์จังหวัดอุดรธานี",
    "สำนักงานการประมงจังหวัดอุดรธานี",
    "สำนักงานชลประทานที่ 6",
    "การไฟฟ้าส่วนภูมิภาคจังหวัดอุดรธานี",
    "การประปาส่วนภูมิภาคอุดรธานี",
    "องค์การบริหารส่วนจังหวัดอุดรธานี",
    "สำนักงานตำรวจแห่งชาติ ภาค 4",
    "ศาลจังหวัดอุดรธานี",
    "สำนักงานอัยการสูงสุดจังหวัดอุดรธานี",
    "สำนักงานพัฒนาชุมชนจังหวัดอุดรธานี",
    "สำนักงานการคลังจังหวัดอุดรธานี",
    "สำนักงานการท่องเที่ยวแห่งประเทศไทย สำนักงานอุดรธานี",
    "สำนักงานการบินพลเรือนแห่งประเทศไทย สนามบินอุดรธานี",
    "สถานีรถไฟอุดรธานี",
    "สำนักงานขนส่งจังหวัดอุดรธานี",
    "สำนักงานการยาสูบจังหวัดอุดรธานี"
  ];

  const checkRoles = async (address: string, provider: ethers.BrowserProvider) => {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
    const adminAddr = await contract.admin()
    setIsAdmin(address.toLowerCase() === adminAddr.toLowerCase())
    const isOff = await contract.officers(address)
    setIsOfficer(isOff)
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      setStatusMessage('กรุณาติดตั้ง MetaMask ก่อนครับ!')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setAccount(address)
      setStatusMessage('เชื่อมต่อเรียบร้อย: ' + address)
      checkRoles(address, provider)
    } catch (error) {
      console.error('เชื่อมต่อล้มเหลว:', error)
      setStatusMessage('เชื่อมต่อล้มเหลว')
    }
  }

  const disconnectWallet = async () => {
    setAccount(null)
    setIsOfficer(false)
    setIsAdmin(false)
    setStatusMessage('ออกจากระบบเรียบร้อย')

    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        })
      } catch (error) {
        console.error('ล้าง permission ล้มเหลว:', error)
      }
    }
  }

  const loadComplaints = async () => {
    if (!window.ethereum) return
    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

      const count = await contract.complaintCount()
      const list: Complaint[] = []

      for (let i = 1; i <= Number(count); i++) {
        const c = await contract.getComplaint(i)
        list.push({
          id: i,
          title: c.title,
          description: c.description,
          location: c.location,
          reporter: c.reporter,
          officerAssigned: c.officerAssigned,
          actionRequired: c.actionRequired,
          status: ['Submitted', 'UnderReview', 'Resolved', 'Reopened', 'Closed'][Number(c.status)],
          timestamp: new Date(Number(c.timestamp) * 1000).toLocaleString('th-TH'),
          expanded: false
        })
      }

      setComplaints(list)
    } catch (error) {
      console.error('โหลดข้อมูลล้มเหลว:', error)
      setStatusMessage('ไม่สามารถโหลดข้อมูลได้ - ตรวจสอบ contract address')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: number) => {
    setComplaints(prev =>
      prev.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c)
    )
  }

  const submitComplaint = async () => {
    if (!account || !location) {
      setStatusMessage('กรุณาเลือกหน่วยงานและกรอกข้อมูลให้ครบ')
      return
    }

    setIsSubmitting(true)
    setStatusMessage('')

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.submitComplaint(title, description, location)
      setStatusMessage('กำลังส่งเรื่องไปยัง Blockchain...')

      await tx.wait()
      setStatusMessage('ส่งเรื่องร้องเรียนสำเร็จ! Tx Hash: ' + tx.hash)

      setTitle('')
      setDescription('')
      setLocation('')
      loadComplaints()
    } catch (error) {
      console.error('ส่งเรื่องล้มเหลว:', error)
      setStatusMessage('ส่งเรื่องล้มเหลว - ตรวจสอบ SepoliaETH และ contract address')
    } finally {
      setIsSubmitting(false)
    }
  }

  const assignToOfficer = async (id: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.assignToOfficer(id)
      await tx.wait()
      setStatusMessage('รับเรื่องสำเร็จ')
      loadComplaints()
    } catch (error) {
      console.error('รับเรื่องล้มเหลว:', error)
      setStatusMessage('รับเรื่องล้มเหลว - ตรวจสอบว่าเป็น Officer ของหน่วยงานนี้หรือไม่ + SepoliaETH')
    }
  }

  const setAction = async (id: number) => {
    if (!actionInput) return
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.setActionRequired(id, actionInput)
      await tx.wait()
      setStatusMessage('บันทึกสิ่งที่ต้องแก้ไขสำเร็จ')
      setActionInput('')
      loadComplaints()
    } catch (error) {
      console.error('บันทึกล้มเหลว:', error)
      setStatusMessage('บันทึกล้มเหลว')
    }
  }

  const markResolved = async (id: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.markAsResolved(id)
      await tx.wait()
      setStatusMessage('อัปเดตเป็น Resolved สำเร็จ')
      loadComplaints()
    } catch (error) {
      console.error('อัปเดตล้มเหลว:', error)
      setStatusMessage('อัปเดตล้มเหลว')
    }
  }

  const confirmResolution = async (id: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.confirmResolution(id)
      await tx.wait()
      setStatusMessage('ยืนยันรับการแก้ไขสำเร็จ')
      loadComplaints()
    } catch (error) {
      console.error('ยืนยันล้มเหลว:', error)
      setStatusMessage('ยืนยันล้มเหลว')
    }
  }

  const rejectResolution = async (id: number) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.rejectResolution(id)
      await tx.wait()
      setStatusMessage('ขอแก้ไขต่อ ส่งเรื่องซ้ำสำเร็จ')
      loadComplaints()
    } catch (error) {
      console.error('ส่งซ้ำล้มเหลว:', error)
      setStatusMessage('ส่งซ้ำล้มเหลว')
    }
  }

  const addOfficer = async () => {
    if (!newOfficerAddress) return
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.addOfficer(newOfficerAddress)
      await tx.wait()
      setStatusMessage('เพิ่มเจ้าหน้าที่สำเร็จ')
      setNewOfficerAddress('')
    } catch (error) {
      console.error('เพิ่มเจ้าหน้าที่ล้มเหลว:', error)
      setStatusMessage('เพิ่มเจ้าหน้าที่ล้มเหลว')
    }
  }

  const assignOfficerToLocationFunc = async () => {
    if (!selectedLocation || !newOfficerAddress) {
      setStatusMessage('กรุณาเลือกหน่วยงานและใส่ address Officer')
      return
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.assignOfficerToLocation(selectedLocation, newOfficerAddress)
      await tx.wait()
      setStatusMessage('ผูก Officer กับหน่วยงานสำเร็จ')
    } catch (error) {
      console.error('ผูกล้มเหลว:', error)
      setStatusMessage('ผูกล้มเหลว')
    }
  }

  useEffect(() => {
    loadComplaints()
  }, [])

  const filteredComplaints = showMyComplaintsOnly
    ? complaints.filter((c) => c.reporter.toLowerCase() === account?.toLowerCase())
    : complaints

  return (
    <div className="app-wrapper">
      <div className="container">
        <h1>ระบบแจ้งร้องเรียนแบบกระจายศูนย์ จังหวัดอุดรธานี</h1>
        <h2>Decentralized Complaint Reporting System</h2>

        {!account ? (
          <div className="login-screen">
            <h3>ยินดีต้อนรับ</h3>
            <p>กรุณาเชื่อมต่อกระเป๋าเงินดิจิทัลเพื่อใช้งานระบบ</p>
            <button onClick={connectWallet} className="connect-btn">
              เชื่อมต่อ MetaMask
            </button>
          </div>
        ) : (
          <div className="main-content">
            <div className="wallet-info">
              <p>กระเป๋าที่เชื่อม: <strong>{account}</strong></p>
              <button onClick={disconnectWallet} className="logout-btn">
                ออกจากระบบ
              </button>
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={showMyComplaintsOnly}
                  onChange={(e) => setShowMyComplaintsOnly(e.target.checked)}
                />
                แสดงเฉพาะเรื่องของฉัน
              </label>
              <button onClick={loadComplaints} className="refresh-btn">
                รีเฟรชรายการ
              </button>
            </div>

            {isAdmin && (
              <div className="admin-section">
                <h3>ส่วนผู้ดูแลระบบ: จัดการเจ้าหน้าที่</h3>
                <input
                  type="text"
                  placeholder="address ของเจ้าหน้าที่ใหม่"
                  value={newOfficerAddress}
                  onChange={(e) => setNewOfficerAddress(e.target.value)}
                />
                <button onClick={addOfficer}>เพิ่มเจ้าหน้าที่</button>

                <h4>ผูก Officer กับหน่วยงาน</h4>
                <select onChange={(e) => setSelectedLocation(e.target.value)}>
                  <option value="">-- เลือกหน่วยงาน --</option>
                  {locations.map((loc, index) => (
                    <option key={index} value={loc}>{loc}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="address ของ Officer"
                  value={newOfficerAddress}
                  onChange={(e) => setNewOfficerAddress(e.target.value)}
                />
                <button onClick={assignOfficerToLocationFunc}>ผูกหน่วยงาน</button>
              </div>
            )}

            <div className="form-section">
              <h3>ยื่นเรื่องร้องเรียนใหม่</h3>
              <select value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">-- เลือกหน่วยงานที่ต้องการร้องเรียน --</option>
                {locations.map((loc, index) => (
                  <option key={index} value={loc}>{loc}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="หัวข้อเรื่องร้องเรียน"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                placeholder="รายละเอียด (โปรดระบุข้อมูลให้ครบถ้วนและชัดเจน)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <button onClick={submitComplaint} disabled={!account || isSubmitting || !location}>
                {isSubmitting ? 'กำลังส่ง...' : 'ส่งเรื่องร้องเรียน'}
              </button>
            </div>

            {statusMessage && <div className="status"><p>{statusMessage}</p></div>}

            <div className="complaints-section">
              <h3>รายการเรื่องร้องเรียนทั้งหมด</h3>
              {loading ? (
                <p>กำลังโหลดข้อมูลจาก Blockchain...</p>
              ) : filteredComplaints.length === 0 ? (
                <p>{showMyComplaintsOnly ? 'คุณยังไม่มีเรื่องร้องเรียน' : 'ยังไม่มีเรื่องร้องเรียน'}</p>
              ) : (
                <table className="complaints-table">
                  <thead>
                    <tr>
                      <th>ลำดับ</th>
                      <th>หน่วยงาน</th>
                      <th>หัวข้อ</th>
                      <th>รายละเอียด</th>
                      <th>ผู้ส่ง</th>
                      <th>Officer</th>
                      <th>สิ่งที่ต้องแก้</th>
                      <th>สถานะ</th>
                      <th>วันที่ส่ง</th>
                      <th>การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((c) => (
                      <>
                        <tr 
                          key={c.id} 
                          onClick={() => toggleExpand(c.id)}
                          className="expandable-row"
                        >
                          <td>{c.id}</td>
                          <td>{c.location}</td>
                          <td>{c.title}</td>
                          <td>
                            {c.description.length > 80 
                              ? c.description.substring(0, 80) + '...' 
                              : c.description}
                            {c.description.length > 80 && <span className="expand-hint"> (คลิกเพื่อดูเต็ม)</span>}
                          </td>
                          <td>{c.reporter.substring(0, 6) + '...' + c.reporter.substring(38)}</td>
                          <td>{c.officerAssigned === '0x0000000000000000000000000000000000000000' ? '-' : c.officerAssigned.substring(0, 6) + '...' + c.officerAssigned.substring(38)}</td>
                          <td>{c.actionRequired || '-'}</td>
                          <td className={`status-${c.status.toLowerCase()}`}>
                            {c.status}
                          </td>
                          <td>{c.timestamp}</td>
                          <td>
                            {isOfficer && c.status === 'Submitted' && (
                              <button onClick={() => assignToOfficer(c.id)}>รับเรื่อง</button>
                            )}
                            {isOfficer && c.status === 'UnderReview' && c.officerAssigned.toLowerCase() === account?.toLowerCase() && (
                              <>
                                <input
                                  type="text"
                                  placeholder="สิ่งที่ต้องแก้ไข"
                                  value={actionInput}
                                  onChange={(e) => setActionInput(e.target.value)}
                                />
                                <button onClick={() => setAction(c.id)}>บันทึก</button>
                                <button onClick={() => markResolved(c.id)}>เสร็จสิ้น</button>
                              </>
                            )}
                            {c.status === 'Resolved' && c.reporter.toLowerCase() === account?.toLowerCase() && (
                              <>
                                <button onClick={() => confirmResolution(c.id)}>ยืนยันรับ</button>
                                <button onClick={() => rejectResolution(c.id)}>ไม่พอใจ ส่งซ้ำ</button>
                              </>
                            )}
                          </td>
                        </tr>

                        {c.expanded && (
                          <tr className="expanded-row">
                            <td colSpan={10}>
                              <div className="expanded-content">
                                <strong>รายละเอียดเต็ม:</strong>
                                <p>{c.description}</p>
                                <strong>สิ่งที่ต้องแก้ไข (จาก Officer):</strong>
                                <p>{c.actionRequired || 'ยังไม่ได้ระบุ'}</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {isSubmitting && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>กำลังส่งเรื่องร้องเรียนไปยัง Blockchain...</p>
            <p>กรุณารอสักครู่ อย่าปิดหน้าต่าง</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App