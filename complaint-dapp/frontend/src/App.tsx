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

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

function Tooltip({ text, children }: TooltipProps) {
  return (
    <div className="tooltip-wrapper">
      {children}
      <span className="tooltip-text">{text}</span>
    </div>
  )
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
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(false)
  const [actionInput, setActionInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'my' | 'my-location' | 'selected-location'>('all')
  const [selectedFilterLocation, setSelectedFilterLocation] = useState('')
  const [officerLocations, setOfficerLocations] = useState<string[]>([])
  const [showWelcomeTour, setShowWelcomeTour] = useState(false)
  const [currentTourStep, setCurrentTourStep] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')

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

  const tourSteps = [
    {
      title: "ยินดีต้อนรับสู่ระบบร้องเรียนแบบ Blockchain",
      content: "ระบบนี้ใช้เทคโนโลยี Blockchain เพื่อความโปร่งใสและไม่สามารถแก้ไขข้อมูลย้อนหลังได้",
      icon: "🔐"
    },
    {
      title: "วิธีเริ่มต้นใช้งาน",
      content: "1. คลิก 'เชื่อมต่อ MetaMask' เพื่อเข้าสู่ระบบ\n2. เลือกหน่วยงานที่ต้องการร้องเรียน\n3. กรอกรายละเอียดและส่งเรื่อง",
      icon: "📝"
    },
    {
      title: "ติดตามสถานะเรื่องของคุณ",
      content: "คุณสามารถดูสถานะและความคืบหน้าของเรื่องร้องเรียนได้แบบ Real-time และโปร่งใส",
      icon: "📊"
    }
  ];

  const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage(message)
    setStatusType(type)
    setTimeout(() => setStatusMessage(''), 8000)
  }

  const checkRoles = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      const adminAddr = await contract.admin()
      setIsAdmin(address.toLowerCase() === adminAddr.toLowerCase())
      const isOff = await contract.officers(address)
      setIsOfficer(isOff)
      if (isOff) {
        const officerLocs: string[] = []
        for (const loc of locations) {
          const isOfLoc = await contract.isOfficerOfLocation(address, loc)
          if (isOfLoc) officerLocs.push(loc)
        }
        setOfficerLocations(officerLocs)
      }
    } catch (error) {
      console.error('ตรวจสอบบทบาทล้มเหลว:', error)
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      showStatus('กรุณาติดตั้ง MetaMask Extension ในเบราว์เซอร์ของคุณก่อนใช้งาน', 'error')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    try {
      setLoadingMessage('กำลังเชื่อมต่อกับ MetaMask...')
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setAccount(address)
      showStatus('✅ เชื่อมต่อสำเร็จ! ยินดีต้อนรับเข้าสู่ระบบ', 'success')
      checkRoles(address, provider)
      
      // Show welcome tour for first-time users
      const hasSeenTour = localStorage.getItem('hasSeenTour')
      if (!hasSeenTour) {
        setShowWelcomeTour(true)
      }
      setLoadingMessage('')
    } catch (error) {
      console.error('เชื่อมต่อล้มเหลว:', error)
      showStatus('❌ เชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง', 'error')
      setLoadingMessage('')
    }
  }

  const disconnectWallet = async () => {
    setAccount(null)
    setIsOfficer(false)
    setIsAdmin(false)
    setOfficerLocations([])
    showStatus('ออกจากระบบเรียบร้อย ขอบคุณที่ใช้บริการ', 'info')

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
    setLoadingMessage('กำลังโหลดข้อมูลจาก Blockchain...')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

      const count = await contract.complaintCount()
      const list: Complaint[] = []

      for (let i = 1; i <= Number(count); i++) {
        setLoadingMessage(`กำลังโหลดเรื่องที่ ${i} จาก ${count}...`)
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
      showStatus(`โหลดข้อมูลสำเร็จ พบเรื่องร้องเรียนทั้งหมด ${count} เรื่อง`, 'success')
    } catch (error) {
      console.error('โหลดข้อมูลล้มเหลว:', error)
      showStatus('❌ ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ', 'error')
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  const toggleExpand = (id: number) => {
    setComplaints(prev =>
      prev.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c)
    )
  }

  const submitComplaint = async () => {
    if (!account || !location) {
      showStatus('⚠️ กรุณาเลือกหน่วยงานและกรอกข้อมูลให้ครบถ้วน', 'error')
      return
    }

    if (!title.trim() || !description.trim()) {
      showStatus('⚠️ กรุณากรอกหัวข้อและรายละเอียดเรื่องร้องเรียน', 'error')
      return
    }

    setIsSubmitting(true)
    setLoadingMessage('กำลังเตรียมข้อมูล...')

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      setLoadingMessage('กำลังส่งเรื่องไปยัง Blockchain...')
      const tx = await contract.submitComplaint(title, description, location)
      
      setLoadingMessage('กำลังรอการยืนยันจาก Network...')
      await tx.wait()
      
      showStatus('✅ ส่งเรื่องร้องเรียนสำเร็จ! ข้อมูลได้ถูกบันทึกลง Blockchain แล้ว', 'success')

      setTitle('')
      setDescription('')
      setLocation('')
      loadComplaints()
    } catch (error) {
      console.error('ส่งเรื่องล้มเหลว:', error)
      showStatus('❌ ส่งเรื่องล้มเหลว กรุณาตรวจสอบ Gas Fee และลองใหม่อีกครั้ง', 'error')
    } finally {
      setIsSubmitting(false)
      setLoadingMessage('')
    }
  }

  const assignToOfficer = async (id: number) => {
    setLoadingMessage('กำลังรับเรื่อง...')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.assignToOfficer(id)
      await tx.wait()
      showStatus('✅ รับเรื่องสำเร็จ! เรื่องนี้ถูกมอบหมายให้คุณแล้ว', 'success')
      loadComplaints()
    } catch (error) {
      console.error('รับเรื่องล้มเหลว:', error)
      showStatus('❌ รับเรื่องล้มเหลว - คุณรับได้เฉพาะเรื่องของหน่วยงานตัวเองเท่านั้น', 'error')
    } finally {
      setLoadingMessage('')
    }
  }

  const setAction = async (id: number) => {
    if (!actionInput) {
      showStatus('⚠️ กรุณากรอกสิ่งที่ต้องแก้ไข', 'error')
      return
    }
    setLoadingMessage('กำลังบันทึกข้อมูล...')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.setActionRequired(id, actionInput)
      await tx.wait()
      showStatus('✅ บันทึกสิ่งที่ต้องแก้ไขสำเร็จ', 'success')
      setActionInput('')
      loadComplaints()
    } catch (error) {
      console.error('บันทึกล้มเหลว:', error)
      showStatus('❌ บันทึกล้มเหลว กรุณาลองใหม่อีกครั้ง', 'error')
    } finally {
      setLoadingMessage('')
    }
  }

  const markResolved = async (id: number) => {
    setLoadingMessage('กำลังอัปเดตสถานะ...')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.markAsResolved(id)
      await tx.wait()
      showStatus('✅ อัปเดตเป็น Resolved สำเร็จ รอการยืนยันจากผู้ร้องเรียน', 'success')
      loadComplaints()
    } catch (error) {
      console.error('อัปเดตล้มเหลว:', error)
      showStatus('❌ อัปเดตล้มเหลว', 'error')
    } finally {
      setLoadingMessage('')
    }
  }

  const confirmResolution = async (id: number) => {
    setLoadingMessage('กำลังยืนยัน...')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.confirmResolution(id)
      await tx.wait()
      showStatus('✅ ยืนยันรับการแก้ไขสำเร็จ ขอบคุณที่ใช้บริการ', 'success')
      loadComplaints()
    } catch (error) {
      console.error('ยืนยันล้มเหลว:', error)
      showStatus('❌ ยืนยันล้มเหลว', 'error')
    } finally {
      setLoadingMessage('')
    }
  }

  const rejectResolution = async (id: number) => {
    setLoadingMessage('กำลังส่งเรื่องซ้ำ...')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.rejectResolution(id)
      await tx.wait()
      showStatus('✅ ขอแก้ไขต่อ ส่งเรื่องซ้ำสำเร็จ', 'success')
      loadComplaints()
    } catch (error) {
      console.error('ส่งซ้ำล้มเหลว:', error)
      showStatus('❌ ส่งซ้ำล้มเหลว', 'error')
    } finally {
      setLoadingMessage('')
    }
  }

  const addOfficer = async () => {
    if (!newOfficerAddress) {
      showStatus('⚠️ กรุณาใส่ Address ของเจ้าหน้าที่', 'error')
      return
    }
    setLoadingMessage('กำลังเพิ่มเจ้าหน้าที่...')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.addOfficer(newOfficerAddress)
      await tx.wait()
      showStatus('✅ เพิ่มเจ้าหน้าที่สำเร็จ', 'success')
      setNewOfficerAddress('')
    } catch (error) {
      console.error('เพิ่มเจ้าหน้าที่ล้มเหลว:', error)
      showStatus('❌ เพิ่มเจ้าหน้าที่ล้มเหลว', 'error')
    } finally {
      setLoadingMessage('')
    }
  }

  const assignOfficerToLocationFunc = async () => {
    if (!selectedLocation || !newOfficerAddress) {
      showStatus('⚠️ กรุณาเลือกหน่วยงานและใส่ address Officer', 'error')
      return
    }
    setLoadingMessage('กำลังผูก Officer กับหน่วยงาน...')
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      const tx = await contract.assignOfficerToLocation(selectedLocation, newOfficerAddress)
      await tx.wait()
      showStatus('✅ ผูก Officer กับหน่วยงานสำเร็จ', 'success')
    } catch (error) {
      console.error('ผูกล้มเหลว:', error)
      showStatus('❌ ผูกล้มเหลว', 'error')
    } finally {
      setLoadingMessage('')
    }
  }

  const closeTour = () => {
    setShowWelcomeTour(false)
    localStorage.setItem('hasSeenTour', 'true')
  }

  const nextTourStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      setCurrentTourStep(prev => prev + 1)
    } else {
      closeTour()
    }
  }

  const prevTourStep = () => {
    if (currentTourStep > 0) {
      setCurrentTourStep(prev => prev - 1)
    }
  }

  useEffect(() => {
    loadComplaints()
  }, [])

  useEffect(() => {
    let filtered = complaints

    if (filterType === 'my') {
      filtered = filtered.filter(c => c.reporter.toLowerCase() === account?.toLowerCase())
    } else if (filterType === 'my-location' && isOfficer && officerLocations.length > 0) {
      filtered = filtered.filter(c => officerLocations.includes(c.location))
    } else if (filterType === 'selected-location' && selectedFilterLocation) {
      filtered = filtered.filter(c => c.location === selectedFilterLocation)
    }

    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredComplaints(filtered)
  }, [complaints, filterType, selectedFilterLocation, searchQuery, isOfficer, officerLocations, account])

  return (
    <div className="app-wrapper">
      <div className="container">
        {/* Header */}
        <div className="app-header">
          <div className="header-icon">🏛️</div>
          <h1>ระบบแจ้งร้องเรียนแบบกระจายศูนย์</h1>
          <h2>จังหวัดอุดรธานี</h2>
          <p className="header-subtitle">Blockchain-Powered Transparent Complaint System</p>
        </div>

        {/* Welcome Tour Modal */}
        {showWelcomeTour && (
          <div className="tour-overlay">
            <div className="tour-modal">
              <button className="tour-close" onClick={closeTour}>✕</button>
              <div className="tour-icon">{tourSteps[currentTourStep].icon}</div>
              <h3>{tourSteps[currentTourStep].title}</h3>
              <p>{tourSteps[currentTourStep].content}</p>
              <div className="tour-progress">
                {tourSteps.map((_, index) => (
                  <span 
                    key={index} 
                    className={`tour-dot ${index === currentTourStep ? 'active' : ''}`}
                  />
                ))}
              </div>
              <div className="tour-buttons">
                {currentTourStep > 0 && (
                  <button onClick={prevTourStep} className="tour-btn-secondary">ก่อนหน้า</button>
                )}
                <button onClick={nextTourStep} className="tour-btn-primary">
                  {currentTourStep === tourSteps.length - 1 ? 'เริ่มใช้งาน' : 'ถัดไป'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!account ? (
          <div className="login-screen">
            <div className="login-icon">🔐</div>
            <h3>ยินดีต้อนรับ</h3>
            <p className="login-description">
              เข้าสู่ระบบร้องเรียนที่โปร่งใส ปลอดภัย และไม่สามารถแก้ไขข้อมูลย้อนหลังได้
              <br/>ด้วยเทคโนโลยี Blockchain
            </p>
            
            <div className="feature-cards">
              <div className="feature-card">
                <div className="feature-icon">✅</div>
                <h4>โปร่งใส</h4>
                <p>ตรวจสอบได้ทุกขั้นตอน</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h4>ปลอดภัย</h4>
                <p>ข้อมูลเข้ารหัสแบบ Blockchain</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h4>รวดเร็ว</h4>
                <p>ติดตาม Real-time</p>
              </div>
            </div>

            <button onClick={connectWallet} className="connect-btn">
              <span className="btn-icon">🦊</span>
              เชื่อมต่อ MetaMask
            </button>
            
            <div className="help-section">
              <p className="help-text">
                <strong>💡 คำแนะนำ:</strong> หากยังไม่มี MetaMask 
                <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"> คลิกที่นี่เพื่อติดตั้ง</a>
              </p>
            </div>
          </div>
        ) : (
          <div className="main-content">
            {/* Wallet Info Bar */}
            <div className="wallet-info">
              <div className="wallet-address">
                <span className="wallet-label">กระเป๋าที่เชื่อม:</span>
                <Tooltip text="คลิกเพื่อคัดลอก Address">
                  <code 
                    className="wallet-code"
                    onClick={() => {
                      navigator.clipboard.writeText(account)
                      showStatus('✅ คัดลอก Address สำเร็จ', 'success')
                    }}
                  >
                    {account.substring(0, 6)}...{account.substring(38)}
                  </code>
                </Tooltip>
              </div>
              
              <button onClick={() => setShowWelcomeTour(true)} className="help-btn">
                <span>❓</span> คู่มือการใช้งาน
              </button>
              
              <button onClick={loadComplaints} className="refresh-btn" disabled={loading}>
                <span>{loading ? '⏳' : '🔄'}</span>
                {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
              </button>
              
              <button onClick={disconnectWallet} className="logout-btn">
                <span>🚪</span> ออกจากระบบ
              </button>
            </div>

            {/* Officer Info */}
            {isOfficer && officerLocations.length > 0 && (
              <div className="officer-info">
                <div className="officer-badge">👮 เจ้าหน้าที่</div>
                <p>คุณรับผิดชอบหน่วยงาน: <strong>{officerLocations.join(', ')}</strong></p>
                <p className="small-note">💡 คุณสามารถรับเรื่อง/จัดการได้เฉพาะเรื่องของหน่วยงานตัวเองเท่านั้น</p>
              </div>
            )}

            {/* Admin Section */}
            {isAdmin && (
              <div className="admin-section">
                <h3>
                  <span className="section-icon">⚙️</span>
                  ส่วนผู้ดูแลระบบ: จัดการเจ้าหน้าที่
                </h3>
                
                <div className="admin-grid">
                  <div className="admin-card">
                    <h4>เพิ่มเจ้าหน้าที่ใหม่</h4>
                    <Tooltip text="ใส่ Ethereum Address ของเจ้าหน้าที่ที่ต้องการเพิ่ม">
                      <input
                        type="text"
                        placeholder="0x... (Ethereum Address)"
                        value={newOfficerAddress}
                        onChange={(e) => setNewOfficerAddress(e.target.value)}
                      />
                    </Tooltip>
                    <button onClick={addOfficer}>
                      <span>➕</span> เพิ่มเจ้าหน้าที่
                    </button>
                  </div>

                  <div className="admin-card">
                    <h4>ผูก Officer กับหน่วยงาน</h4>
                    <select 
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      <option value="">-- เลือกหน่วยงาน --</option>
                      {locations.map((loc, index) => (
                        <option key={index} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="0x... (Officer Address)"
                      value={newOfficerAddress}
                      onChange={(e) => setNewOfficerAddress(e.target.value)}
                    />
                    <button onClick={assignOfficerToLocationFunc}>
                      <span>🔗</span> ผูกหน่วยงาน
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Complaint Form */}
            <div className="form-section">
              <h3>
                <span className="section-icon">📝</span>
                ยื่นเรื่องร้องเรียนใหม่
              </h3>
              
              <div className="form-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <label>เลือกหน่วยงานที่ต้องการร้องเรียน</label>
                    <Tooltip text="เลือกหน่วยงานที่เกี่ยวข้องกับเรื่องร้องเรียนของคุณ">
                      <select 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)}
                        className={location ? 'filled' : ''}
                      >
                        <option value="">-- กรุณาเลือกหน่วยงาน --</option>
                        {locations.map((loc, index) => (
                          <option key={index} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </Tooltip>
                  </div>
                </div>

                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <label>กรอกหัวข้อเรื่องร้องเรียน</label>
                    <Tooltip text="ระบุหัวข้อสั้นๆ ที่สรุปเรื่องร้องเรียน">
                      <input
                        type="text"
                        placeholder="เช่น: ถนนชำรุด, ไฟฟ้าดับบ่อย, เจ้าหน้าที่ให้บริการไม่ดี"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={title ? 'filled' : ''}
                      />
                    </Tooltip>
                  </div>
                </div>

                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <label>รายละเอียดเรื่องร้องเรียน</label>
                    <Tooltip text="โปรดระบุรายละเอียดให้ครบถ้วนและชัดเจนเพื่อให้เจ้าหน้าที่สามารถดำเนินการได้อย่างถูกต้อง">
                      <textarea
                        placeholder="กรุณาระบุรายละเอียดให้ครบถ้วน เช่น สถานที่, วันเวลาที่เกิดเหตุ, ผลกระทบที่ได้รับ และสิ่งที่ต้องการให้แก้ไข"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={description ? 'filled' : ''}
                        rows={6}
                      />
                    </Tooltip>
                    <div className="char-count">
                      {description.length} ตัวอักษร
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={submitComplaint} 
                disabled={!account || isSubmitting || !location || !title || !description}
                className="submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-small"></span>
                    กำลังส่งไปยัง Blockchain...
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    ส่งเรื่องร้องเรียน
                  </>
                )}
              </button>
              
              {!location && (
                <p className="form-hint">💡 เริ่มต้นโดยเลือกหน่วยงานที่ต้องการร้องเรียน</p>
              )}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className={`status status-${statusType}`}>
                <div className="status-icon">
                  {statusType === 'success' && '✅'}
                  {statusType === 'error' && '❌'}
                  {statusType === 'info' && 'ℹ️'}
                </div>
                <p>{statusMessage}</p>
              </div>
            )}

            {/* Complaints Section */}
            <div className="complaints-section">
              <h3>
                <span className="section-icon">📊</span>
                รายการเรื่องร้องเรียนทั้งหมด
              </h3>

              {/* Table Controls */}
              <div className="table-controls">
                <div className="search-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="ค้นหาตามหัวข้อ, รายละเอียด, หน่วยงาน..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>

                {isOfficer && (
                  <div className="officer-filters">
                    <button
                      className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterType('all')}
                    >
                      📋 แสดงทั้งหมด
                    </button>
                    <button
                      className={`filter-btn ${filterType === 'my' ? 'active' : ''}`}
                      onClick={() => setFilterType('my')}
                    >
                      👤 เรื่องของฉัน
                    </button>
                    <button
                      className={`filter-btn ${filterType === 'my-location' ? 'active' : ''}`}
                      onClick={() => setFilterType('my-location')}
                    >
                      🏢 หน่วยงานของฉัน
                    </button>
                    <select
                      value={selectedFilterLocation}
                      onChange={(e) => {
                        setSelectedFilterLocation(e.target.value)
                        setFilterType('selected-location')
                      }}
                      className="location-filter"
                    >
                      <option value="">🔽 เลือกหน่วยงาน...</option>
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Results Summary */}
              {!loading && (
                <div className="results-summary">
                  พบทั้งหมด <strong>{filteredComplaints.length}</strong> เรื่อง
                  {searchQuery && ` จากการค้นหา "${searchQuery}"`}
                </div>
              )}

              {/* Table */}
              {loading ? (
                <div className="table-loading">
                  <div className="spinner-large"></div>
                  <p>กำลังโหลดข้อมูลจาก Blockchain...</p>
                  <p className="loading-detail">{loadingMessage}</p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h4>ไม่พบเรื่องร้องเรียน</h4>
                  <p>
                    {searchQuery 
                      ? 'ลองค้นหาด้วยคำอื่น หรือเปลี่ยนตัวกรอง' 
                      : 'เริ่มต้นโดยส่งเรื่องร้องเรียนของคุณ'}
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
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
                            <td>
                              <div className="id-badge">#{c.id}</div>
                            </td>
                            <td>
                              <div className="location-cell">{c.location}</div>
                            </td>
                            <td>
                              <strong>{c.title}</strong>
                            </td>
                            <td>
                              <div className="description-cell">
                                {c.description.length > 80 
                                  ? c.description.substring(0, 80) + '...' 
                                  : c.description}
                                {c.description.length > 80 && (
                                  <span className="expand-hint">👁️ คลิกเพื่อดูเต็ม</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <code className="address-short">
                                {c.reporter.substring(0, 6)}...{c.reporter.substring(38)}
                              </code>
                            </td>
                            <td>
                              {c.officerAssigned === '0x0000000000000000000000000000000000000000' ? (
                                <span className="not-assigned">-</span>
                              ) : (
                                <code className="address-short">
                                  {c.officerAssigned.substring(0, 6)}...{c.officerAssigned.substring(38)}
                                </code>
                              )}
                            </td>
                            <td>
                              {c.actionRequired ? (
                                <div className="action-required">{c.actionRequired}</div>
                              ) : (
                                <span className="not-assigned">-</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge status-${c.status.toLowerCase()}`}>
                                {c.status === 'Submitted' && '📝 Submitted'}
                                {c.status === 'UnderReview' && '🔍 Under Review'}
                                {c.status === 'Resolved' && '✅ Resolved'}
                                {c.status === 'Reopened' && '🔄 Reopened'}
                                {c.status === 'Closed' && '🔒 Closed'}
                              </span>
                            </td>
                            <td>
                              <div className="timestamp">{c.timestamp}</div>
                            </td>
                            <td className="action-cell">
                              {isOfficer && c.status === 'Submitted' && officerLocations.includes(c.location) && (
                                <Tooltip text="คลิกเพื่อรับเรื่องนี้มาดำเนินการ">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); assignToOfficer(c.id); }}
                                    className="btn-action btn-primary"
                                  >
                                    <span>👍</span> รับเรื่อง
                                  </button>
                                </Tooltip>
                              )}
                              {isOfficer && c.status === 'UnderReview' && c.officerAssigned.toLowerCase() === account?.toLowerCase() && (
                                <div className="action-group" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    placeholder="ระบุสิ่งที่ต้องแก้ไข..."
                                    value={actionInput}
                                    onChange={(e) => setActionInput(e.target.value)}
                                    className="action-input"
                                  />
                                  <button 
                                    onClick={() => setAction(c.id)}
                                    className="btn-action btn-secondary"
                                  >
                                    <span>💾</span> บันทึก
                                  </button>
                                  <button 
                                    onClick={() => markResolved(c.id)}
                                    className="btn-action btn-success"
                                  >
                                    <span>✅</span> เสร็จสิ้น
                                  </button>
                                </div>
                              )}
                              {c.status === 'Resolved' && c.reporter.toLowerCase() === account?.toLowerCase() && (
                                <div className="action-group" onClick={(e) => e.stopPropagation()}>
                                  <Tooltip text="ยืนยันว่าพอใจกับการแก้ไข">
                                    <button 
                                      onClick={() => confirmResolution(c.id)}
                                      className="btn-action btn-success"
                                    >
                                      <span>👍</span> ยืนยันรับ
                                    </button>
                                  </Tooltip>
                                  <Tooltip text="ไม่พอใจกับการแก้ไข ส่งเรื่องซ้ำ">
                                    <button 
                                      onClick={() => rejectResolution(c.id)}
                                      className="btn-action btn-danger"
                                    >
                                      <span>👎</span> ส่งซ้ำ
                                    </button>
                                  </Tooltip>
                                </div>
                              )}
                            </td>
                          </tr>

                          {c.expanded && (
                            <tr className="expanded-row">
                              <td colSpan={10}>
                                <div className="expanded-content">
                                  <div className="expanded-section">
                                    <strong>📄 รายละเอียดเต็ม:</strong>
                                    <p>{c.description}</p>
                                  </div>
                                  <div className="expanded-section">
                                    <strong>🔧 สิ่งที่ต้องแก้ไข (จาก Officer):</strong>
                                    <p>{c.actionRequired || 'ยังไม่ได้ระบุ'}</p>
                                  </div>
                                  <div className="expanded-section">
                                    <strong>ℹ️ ข้อมูลเพิ่มเติม:</strong>
                                    <div className="info-grid">
                                      <div className="info-item">
                                        <span className="info-label">ผู้ส่ง:</span>
                                        <code>{c.reporter}</code>
                                      </div>
                                      {c.officerAssigned !== '0x0000000000000000000000000000000000000000' && (
                                        <div className="info-item">
                                          <span className="info-label">Officer:</span>
                                          <code>{c.officerAssigned}</code>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Loading Overlay */}
      {(isSubmitting || loadingMessage) && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-animation">
              <div className="blockchain-blocks">
                <div className="block"></div>
                <div className="block"></div>
                <div className="block"></div>
              </div>
            </div>
            <h3>กำลังดำเนินการ...</h3>
            <p className="loading-main">{loadingMessage || 'กำลังส่งข้อมูลไปยัง Blockchain'}</p>
            <p className="loading-sub">ข้อมูลของคุณกำลังถูกบันทึกอย่างปลอดภัยและถาวร</p>
            <div className="loading-tips">
              <p>💡 <strong>คำแนะนำ:</strong> กรุณารอสักครู่ อย่าปิดหน้าต่างนี้</p>
              <p>⏱️ การทำรายการอาจใช้เวลา 10-30 วินาที</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App