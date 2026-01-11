import { useState } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractInfo'
import './App.css'

function App() {
  const [account, setAccount] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  // ฟังก์ชันเชื่อมต่อ MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        setAccount(address)
        setStatusMessage('เชื่อมต่อกระเป๋าเงินดิจิทัลเรียบร้อยแล้ว: ' + address)
      } catch (error) {
        console.error(error)
        setStatusMessage('ไม่สามารถเชื่อมต่อกระเป๋าเงินดิจิทัลได้ กรุณาลองใหม่อีกครั้ง')
      }
    } else {
      setStatusMessage('ไม่พบกระเป๋าเงินดิจิทัล MetaMask กรุณาติดตั้งก่อนดำเนินการ')
    }
  }

  // ฟังก์ชันส่งเรื่องร้องเรียน
  const submitComplaint = async () => {
    if (!account) {
      setStatusMessage('กรุณาเชื่อมต่อกระเป๋าเงินดิจิทัลก่อนดำเนินการ')
      return
    }
    if (!title || !description) {
      setStatusMessage('กรุณากรอกหัวข้อและรายละเอียดของเรื่องร้องเรียนให้ครบถ้วน')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      )

      const tx = await contract.submitComplaint(title, description)
      setStatusMessage('ระบบกำลังดำเนินการบันทึกข้อมูลลงบนเครือข่าย Blockchain')

      await tx.wait()
      setStatusMessage('การส่งเรื่องร้องเรียนเสร็จสมบูรณ์ (Transaction Hash: ' + tx.hash + ')')

      // ล้างข้อมูลในแบบฟอร์ม
      setTitle('')
      setDescription('')
    } catch (error) {
      console.error(error)
      setStatusMessage('ไม่สามารถส่งเรื่องร้องเรียนได้: ' + (error as Error).message)
    }
  }

  return (
    <div className="container">
      <h1>ระบบรับแจ้งเรื่องร้องเรียนแบบกระจายศูนย์</h1>
      <h2>Decentralized Complaint Reporting System (Blockchain-based)</h2>

      {!account ? (
        <button onClick={connectWallet} className="connect-btn">
          เชื่อมต่อกระเป๋าเงินดิจิทัล (MetaMask)
        </button>
      ) : (
        <div>
          <p>
            กระเป๋าเงินดิจิทัลที่เชื่อมต่อแล้ว: <strong>{account}</strong>
          </p>
        </div>
      )}

      <div className="form-section">
        <h3>แบบฟอร์มการยื่นเรื่องร้องเรียน</h3>
        <input
          type="text"
          placeholder="หัวข้อเรื่องร้องเรียน"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="รายละเอียดข้อร้องเรียน (โปรดระบุข้อมูลให้ครบถ้วนและชัดเจน)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button onClick={submitComplaint} disabled={!account}>
          ยืนยันการส่งเรื่องร้องเรียน
        </button>
      </div>

      {statusMessage && (
        <div className="status">
          <p>{statusMessage}</p>
        </div>
      )}
    </div>
  )
}

export default App
