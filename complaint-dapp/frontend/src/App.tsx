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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [showMyComplaintsOnly, setShowMyComplaintsOnly] = useState(false)

  // รายการหน่วยงาน 33 แห่งในอุดรธานี (ตามที่คุณต้องการ)
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

  // เชื่อมต่อ MetaMask
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
    } catch (error) {
      console.error(error)
      setStatusMessage('เชื่อมต่อล้มเหลว')
    }
  }

  // Logout
  const disconnectWallet = () => {
    setAccount(null)
    setStatusMessage('ออกจากระบบเรียบร้อย')
  }

  // โหลดข้อมูลเรื่องร้องเรียน
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
      setStatusMessage('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  // สลับการขยายแถว
  const toggleExpand = (id: number) => {
    setComplaints(prev =>
      prev.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c)
    )
  }

  // ส่งเรื่องร้องเรียน
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
      setStatusMessage('ส่งเรื่องร้องเรียนสำเร็จ! Transaction Hash: ' + tx.hash)

      setTitle('')
      setDescription('')
      setLocation('')
      loadComplaints()
    } catch (error) {
      console.error(error)
      setStatusMessage('ส่งเรื่องล้มเหลว: ' + (error as Error).message)
    } finally {
      setIsSubmitting(false)
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

            <div className="form-section">
              <h3>ยื่นเรื่องร้องเรียนใหม่</h3>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
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
                      <th>สถานะ</th>
                      <th>วันที่ส่ง</th>
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
                          <td className={`status-${c.status.toLowerCase()}`}>
                            {c.status}
                          </td>
                          <td>{c.timestamp}</td>
                        </tr>

                        {c.expanded && (
                          <tr className="expanded-row">
                            <td colSpan={7}>
                              <div className="expanded-content">
                                <strong>รายละเอียดเต็ม:</strong>
                                <p>{c.description}</p>
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