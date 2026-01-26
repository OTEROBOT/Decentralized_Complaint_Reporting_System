import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractInfo'
import './App.css'

interface Complaint {
  id: number;
  title: string;
  description: string;
  reporter: string;
  status: string;
  timestamp: string;
}

function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [showMyComplaintsOnly, setShowMyComplaintsOnly] = useState(false) // toggle กรองเรื่องของฉัน

  // เชื่อม MetaMask
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
      setStatusMessage('เชื่อมต่อกระเป๋าเงินดิจิทัลเรียบร้อย: ' + address)
    } catch (error) {
      console.error(error)
      setStatusMessage('เชื่อมต่อล้มเหลว กรุณาลองใหม่')
    }
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
          reporter: c.reporter,
          status: ['Submitted', 'UnderReview', 'Resolved'][Number(c.status)],
          timestamp: new Date(Number(c.timestamp) * 1000).toLocaleString('th-TH')
        })
      }

      setComplaints(list)
    } catch (error) {
      console.error(error)
      setStatusMessage('ไม่สามารถโหลดข้อมูลได้: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // ส่งเรื่องร้องเรียน
  const submitComplaint = async () => {
    if (!account) {
      setStatusMessage('กรุณาเชื่อมต่อกระเป๋าเงินก่อน')
      return
    }
    if (!title || !description) {
      setStatusMessage('กรุณากรอกข้อมูลให้ครบ')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.submitComplaint(title, description)
      setStatusMessage('กำลังบันทึก... รอ transaction ยืนยัน')

      await tx.wait()
      setStatusMessage('ส่งเรื่องสำเร็จ! Tx Hash: ' + tx.hash)

      setTitle('')
      setDescription('')
      loadComplaints() // รีโหลดรายการใหม่
    } catch (error) {
      console.error(error)
      setStatusMessage('ส่งเรื่องล้มเหลว: ' + (error as Error).message)
    }
  }

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    loadComplaints()
  }, [])

  // กรองเฉพาะเรื่องของฉัน (ถ้าเปิด toggle)
  const filteredComplaints = showMyComplaintsOnly
    ? complaints.filter((c) => c.reporter.toLowerCase() === account?.toLowerCase())
    : complaints

  return (
    <div className="container">
      <h1>ระบบแจ้งร้องเรียนแบบกระจายศูนย์</h1>
      <h2>Decentralized Complaint Reporting System</h2>

      {!account ? (
        <button onClick={connectWallet} className="connect-btn">
          เชื่อมต่อ MetaMask
        </button>
      ) : (
        <div className="wallet-info">
          <p>กระเป๋าที่เชื่อม: <strong>{account}</strong></p>
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
      )}

      <div className="form-section">
        <h3>ยื่นเรื่องร้องเรียนใหม่</h3>
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
        <button onClick={submitComplaint} disabled={!account}>
          ส่งเรื่องร้องเรียน
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
                <th>หัวข้อ</th>
                <th>รายละเอียด</th>
                <th>ผู้ส่ง</th>
                <th>สถานะ</th>
                <th>วันที่ส่ง</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.title}</td>
                  <td>{c.description.length > 80 ? c.description.substring(0, 80) + '...' : c.description}</td>
                  <td>{c.reporter.substring(0, 6) + '...' + c.reporter.substring(38)}</td>
                  <td className={`status-${c.status.toLowerCase()}`}>
                    {c.status}
                  </td>
                  <td>{c.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default App