import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractInfo'
import './App.css'

// ไฟล์ชื่อ: App.tsx

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
  // ลบ location และ setLocation ที่ไม่ได้ใช้
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
    } catch (err) {
      console.error('ตรวจสอบบทบาทล้มเหลว:', err)
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
    } catch (err) {
      console.error('เชื่อมต่อล้มเหลว:', err)
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
      } catch (err) {
  console.error(err);
  showStatus("Something went wrong while disconnecting wallet", "error");
}
    }
  }

  const submitComplaint = async () => {
    if (!account) {
      showStatus('กรุณาเชื่อมต่อ MetaMask ก่อนส่งเรื่อง', 'error')
      return
    }

    if (!title.trim() || !description.trim() || !selectedLocation) {
      showStatus('⚠️ กรุณากรอกข้อมูลให้ครบทุกช่อง', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      setLoadingMessage('กำลังส่งเรื่องร้องเรียนไปยัง Blockchain...')

      // แก้ไข: เพิ่มการตรวจสอบ window.ethereum
      if (!window.ethereum) {
        throw new Error('MetaMask not found')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.submitComplaint(title, description, selectedLocation)
      setLoadingMessage('กำลังรอการยืนยันจาก Blockchain...')
      await tx.wait()

      showStatus('✅ ส่งเรื่องร้องเรียนสำเร็จ! ข้อมูลถูกบันทึกบน Blockchain แล้ว', 'success')
      setTitle('')
      setDescription('')
      setSelectedLocation('')
      loadComplaints()
    } catch (err) {
      console.error('ส่งเรื่องล้มเหลว:', err)
      // แก้ไข: ระบุ type ของ error
      const error = err as { code?: string }
      if (error.code === 'ACTION_REJECTED') {
        showStatus('❌ คุณปฏิเสธการทำรายการ', 'error')
      } else {
        showStatus('❌ ส่งเรื่องล้มเหลว กรุณาลองใหม่อีกครั้ง', 'error')
      }
    } finally {
      setIsSubmitting(false)
      setLoadingMessage('')
    }
  }

  // แก้ไข: ใช้ useCallback เพื่อแก้ปัญหา React Hook dependency
  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true)
      
      // แก้ไข: เพิ่มการตรวจสอบ window.ethereum
      if (!window.ethereum) {
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

      const count = await contract.complaintCount()
      const complaintsData: Complaint[] = []

      for (let i = 1; i <= count; i++) {
        const c = await contract.complaints(i)
        const date = new Date(Number(c.timestamp) * 1000)
        const thaiDate = date.toLocaleString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })

        complaintsData.push({
          id: Number(c.id),
          title: c.title,
          description: c.description,
          location: c.location,
          reporter: c.reporter,
          officerAssigned: c.officerAssigned,
          actionRequired: c.actionRequired,
          status: c.status,
          timestamp: thaiDate,
          expanded: false
        })
      }

      complaintsData.sort((a, b) => b.id - a.id)
      setComplaints(complaintsData)
    } catch (err) {
      console.error('โหลดข้อมูลล้มเหลว:', err)
      showStatus('⚠️ ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่', 'error')
    } finally {
      setLoading(false)
    }
  }, []) // ไม่มี dependencies เพราะฟังก์ชันนี้ไม่ต้องพึ่งพา state ใดๆ

  const addOfficer = async () => {
    if (!isAdmin) {
      showStatus('❌ คุณไม่มีสิทธิ์ดำเนินการนี้', 'error')
      return
    }

    if (!newOfficerAddress.trim() || !selectedLocation) {
      showStatus('⚠️ กรุณากรอกที่อยู่ Officer และเลือกสถานที่', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      setLoadingMessage('กำลังเพิ่ม Officer...')

      // แก้ไข: เพิ่มการตรวจสอบ window.ethereum
      if (!window.ethereum) {
        throw new Error('MetaMask not found')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.addOfficer(newOfficerAddress, selectedLocation)
      setLoadingMessage('กำลังรอการยืนยัน...')
      await tx.wait()

      showStatus('✅ เพิ่ม Officer สำเร็จแล้ว!', 'success')
      setNewOfficerAddress('')
      setSelectedLocation('')
    } catch (err) {
      console.error('เพิ่ม Officer ล้มเหลว:', err)
      // แก้ไข: ระบุ type ของ error
      const error = err as { code?: string }
      if (error.code === 'ACTION_REJECTED') {
        showStatus('❌ คุณปฏิเสธการทำรายการ', 'error')
      } else {
        showStatus('❌ เพิ่ม Officer ล้มเหลว', 'error')
      }
    } finally {
      setIsSubmitting(false)
      setLoadingMessage('')
    }
  }

  const assignToOfficer = async (complaintId: number) => {
    try {
      setIsSubmitting(true)
      setLoadingMessage('กำลังรับเรื่อง...')

      // แก้ไข: เพิ่มการตรวจสอบ window.ethereum
      if (!window.ethereum) {
        throw new Error('MetaMask not found')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.assignToOfficer(complaintId)
      setLoadingMessage('กำลังรอการยืนยัน...')
      await tx.wait()

      showStatus('✅ รับเรื่องสำเร็จ! คุณสามารถเริ่มดำเนินการได้', 'success')
      loadComplaints()
    } catch (err) {
      console.error('รับเรื่องล้มเหลว:', err)
      // แก้ไข: ระบุ type ของ error
      const error = err as { code?: string }
      if (error.code === 'ACTION_REJECTED') {
        showStatus('❌ คุณปฏิเสธการทำรายการ', 'error')
      } else {
        showStatus('❌ รับเรื่องล้มเหลว', 'error')
      }
    } finally {
      setIsSubmitting(false)
      setLoadingMessage('')
    }
  }

  const setAction = async (complaintId: number) => {
    if (!actionInput.trim()) {
      showStatus('⚠️ กรุณาระบุสิ่งที่ต้องแก้ไข', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      setLoadingMessage('กำลังบันทึกข้อมูล...')

      // แก้ไข: เพิ่มการตรวจสอบ window.ethereum
      if (!window.ethereum) {
        throw new Error('MetaMask not found')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.setAction(complaintId, actionInput)
      setLoadingMessage('กำลังรอการยืนยัน...')
      await tx.wait()

      showStatus('✅ บันทึกสำเร็จแล้ว!', 'success')
      setActionInput('')
      loadComplaints()
    } catch (err) {
      console.error('บันทึกล้มเหลว:', err)
      // แก้ไข: ระบุ type ของ error
      const error = err as { code?: string }
      if (error.code === 'ACTION_REJECTED') {
        showStatus('❌ คุณปฏิเสธการทำรายการ', 'error')
      } else {
        showStatus('❌ บันทึกล้มเหลว', 'error')
      }
    } finally {
      setIsSubmitting(false)
      setLoadingMessage('')
    }
  }

  const markResolved = async (complaintId: number) => {
    try {
      setIsSubmitting(true)
      setLoadingMessage('กำลังบันทึกสถานะ...')

      // แก้ไข: เพิ่มการตรวจสอบ window.ethereum
      if (!window.ethereum) {
        throw new Error('MetaMask not found')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.markResolved(complaintId)
      setLoadingMessage('กำลังรอการยืนยัน...')
      await tx.wait()

      showStatus('✅ ทำเครื่องหมายเป็นแก้ไขแล้วสำเร็จ! รอผู้ร้องเรียนยืนยัน', 'success')
      loadComplaints()
    } catch (err) {
      console.error('ทำเครื่องหมายล้มเหลว:', err)
      // แก้ไข: ระบุ type ของ error
      const error = err as { code?: string }
      if (error.code === 'ACTION_REJECTED') {
        showStatus('❌ คุณปฏิเสธการทำรายการ', 'error')
      } else {
        showStatus('❌ ทำเครื่องหมายล้มเหลว', 'error')
      }
    } finally {
      setIsSubmitting(false)
      setLoadingMessage('')
    }
  }

  const confirmResolution = async (complaintId: number) => {
    try {
      setIsSubmitting(true)
      setLoadingMessage('กำลังยืนยัน...')

      // แก้ไข: เพิ่มการตรวจสอบ window.ethereum
      if (!window.ethereum) {
        throw new Error('MetaMask not found')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.confirmResolution(complaintId)
      setLoadingMessage('กำลังรอการยืนยัน...')
      await tx.wait()

      showStatus('✅ ยืนยันรับเรียบร้อย! เรื่องนี้ปิดแล้ว', 'success')
      loadComplaints()
    } catch (err) {
      console.error('ยืนยันล้มเหลว:', err)
      // แก้ไข: ระบุ type ของ error
      const error = err as { code?: string }
      if (error.code === 'ACTION_REJECTED') {
        showStatus('❌ คุณปฏิเสธการทำรายการ', 'error')
      } else {
        showStatus('❌ ยืนยันล้มเหลว', 'error')
      }
    } finally {
      setIsSubmitting(false)
      setLoadingMessage('')
    }
  }

  const rejectResolution = async (complaintId: number) => {
    try {
      setIsSubmitting(true)
      setLoadingMessage('กำลังส่งเรื่องซ้ำ...')

      // แก้ไข: เพิ่มการตรวจสอบ window.ethereum
      if (!window.ethereum) {
        throw new Error('MetaMask not found')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      const tx = await contract.rejectResolution(complaintId)
      setLoadingMessage('กำลังรอการยืนยัน...')
      await tx.wait()

      showStatus('✅ ส่งเรื่องซ้ำสำเร็จ! Officer จะได้รับเรื่องอีกครั้ง', 'success')
      loadComplaints()
    } catch (err) {
      console.error('ส่งซ้ำล้มเหลว:', err)
      // แก้ไข: ระบุ type ของ error
      const error = err as { code?: string }
      if (error.code === 'ACTION_REJECTED') {
        showStatus('❌ คุณปฏิเสธการทำรายการ', 'error')
      } else {
        showStatus('❌ ส่งซ้ำล้มเหลว', 'error')
      }
    } finally {
      setIsSubmitting(false)
      setLoadingMessage('')
    }
  }

  const toggleExpand = (id: number) => {
    setFilteredComplaints(prev =>
      prev.map(c => (c.id === id ? { ...c, expanded: !c.expanded } : c))
    )
  }

  // แก้ไข: เพิ่ม loadComplaints ใน dependency array
  useEffect(() => {
    if (account) {
      loadComplaints()
    }
  }, [account, loadComplaints])

  useEffect(() => {
    let filtered = complaints

    if (filterType === 'my') {
      filtered = filtered.filter(c => c.reporter.toLowerCase() === account?.toLowerCase())
    } else if (filterType === 'my-location' && isOfficer) {
      filtered = filtered.filter(c => officerLocations.includes(c.location))
    } else if (filterType === 'selected-location' && selectedFilterLocation) {
      filtered = filtered.filter(c => c.location === selectedFilterLocation)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.location.toLowerCase().includes(query) ||
        c.id.toString().includes(query)
      )
    }

    setFilteredComplaints(filtered)
  }, [complaints, filterType, searchQuery, selectedFilterLocation, account, isOfficer, officerLocations])

  return (
    <div className="app-container">
      {statusMessage && (
        <div className={`status-banner status-${statusType}`}>
          {statusMessage}
        </div>
      )}

      <div className="header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">📋</span>
            ระบบร้องเรียน Blockchain
          </h1>
          {!account ? (
            <button onClick={connectWallet} className="btn-connect">
              <span>🔗</span> เชื่อมต่อ MetaMask
            </button>
          ) : (
            <div className="account-info">
              <div className="role-badges">
                {isAdmin && <span className="role-badge admin">👑 Admin</span>}
                {isOfficer && <span className="role-badge officer">👮 Officer</span>}
                {!isAdmin && !isOfficer && <span className="role-badge user">👤 User</span>}
              </div>
              <span className="account-address">
                {account.substring(0, 6)}...{account.substring(38)}
              </span>
              <button onClick={disconnectWallet} className="btn-disconnect">
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>
      </div>

      {showWelcomeTour && (
        <div className="tour-overlay">
          <div className="tour-modal">
            <div className="tour-icon">{tourSteps[currentTourStep].icon}</div>
            <h2>{tourSteps[currentTourStep].title}</h2>
            <p style={{ whiteSpace: 'pre-line' }}>{tourSteps[currentTourStep].content}</p>
            <div className="tour-progress">
              {tourSteps.map((_, index) => (
                <div 
                  key={index} 
                  className={`progress-dot ${index === currentTourStep ? 'active' : ''} ${index < currentTourStep ? 'completed' : ''}`}
                />
              ))}
            </div>
            <div className="tour-actions">
              {currentTourStep > 0 && (
                <button 
                  onClick={() => setCurrentTourStep(prev => prev - 1)}
                  className="btn-tour btn-secondary"
                >
                  ← ย้อนกลับ
                </button>
              )}
              {currentTourStep < tourSteps.length - 1 ? (
                <button 
                  onClick={() => setCurrentTourStep(prev => prev + 1)}
                  className="btn-tour btn-primary"
                >
                  ถัดไป →
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setShowWelcomeTour(false)
                    localStorage.setItem('hasSeenTour', 'true')
                  }}
                  className="btn-tour btn-success"
                >
                  ✓ เริ่มใช้งาน
                </button>
              )}
            </div>
            <button 
              onClick={() => {
                setShowWelcomeTour(false)
                localStorage.setItem('hasSeenTour', 'true')
              }}
              className="tour-skip"
            >
              ข้าม
            </button>
          </div>
        </div>
      )}

      <div className="main-content">
        {account ? (
          <div className="panels-container">
            <div className="panel submit-panel">
              <div className="panel-header">
                <h2>
                  <span className="panel-icon">📝</span>
                  ส่งเรื่องร้องเรียน
                </h2>
              </div>
              <div className="form-container">
                <div className="form-group">
                  <label>
                    <span className="label-icon">🏢</span>
                    หน่วยงานที่ต้องการร้องเรียน
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- เลือกหน่วยงาน --</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <span className="label-icon">📌</span>
                    หัวข้อเรื่อง
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="ระบุหัวข้อสั้นๆ"
                    className="form-input"
                    maxLength={100}
                  />
                  <div className="char-count">{title.length}/100</div>
                </div>

                <div className="form-group">
                  <label>
                    <span className="label-icon">📄</span>
                    รายละเอียด
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="อธิบายรายละเอียดเรื่องร้องเรียน"
                    className="form-textarea"
                    rows={6}
                    maxLength={500}
                  />
                  <div className="char-count">{description.length}/500</div>
                </div>

                <button
                  onClick={submitComplaint}
                  disabled={isSubmitting || !title.trim() || !description.trim() || !selectedLocation}
                  className="btn-submit"
                >
                  <span>📤</span> ส่งเรื่องร้องเรียน
                </button>
              </div>
            </div>

            {isAdmin && (
              <div className="panel admin-panel">
                <div className="panel-header">
                  <h2>
                    <span className="panel-icon">👑</span>
                    จัดการ Officer
                  </h2>
                </div>
                <div className="form-container">
                  <div className="form-group">
                    <label>
                      <span className="label-icon">🏢</span>
                      หน่วยงาน
                    </label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="form-select"
                    >
                      <option value="">-- เลือกหน่วยงาน --</option>
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      <span className="label-icon">👮</span>
                      ที่อยู่ Officer
                    </label>
                    <input
                      type="text"
                      value={newOfficerAddress}
                      onChange={(e) => setNewOfficerAddress(e.target.value)}
                      placeholder="0x..."
                      className="form-input"
                    />
                  </div>

                  <button
                    onClick={addOfficer}
                    disabled={isSubmitting || !newOfficerAddress.trim() || !selectedLocation}
                    className="btn-submit"
                  >
                    <span>➕</span> เพิ่ม Officer
                  </button>
                </div>
              </div>
            )}

            <div className="panel complaints-panel">
              <div className="panel-header">
                <h2>
                  <span className="panel-icon">📊</span>
                  รายการเรื่องร้องเรียน
                </h2>
                <button onClick={loadComplaints} className="btn-refresh" disabled={loading}>
                  <span>{loading ? '⏳' : '🔄'}</span>
                  {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
                </button>
              </div>

              <div className="filters-section">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาจากหัวข้อ, รายละเอียด, หน่วยงาน หรือ ID..."
                    className="search-input"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="clear-search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="filter-buttons">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  >
                    <span>📋</span> ทั้งหมด
                  </button>
                  <button
                    onClick={() => setFilterType('my')}
                    className={`filter-btn ${filterType === 'my' ? 'active' : ''}`}
                  >
                    <span>👤</span> เรื่องของฉัน
                  </button>
                  {isOfficer && officerLocations.length > 0 && (
                    <button
                      onClick={() => setFilterType('my-location')}
                      className={`filter-btn ${filterType === 'my-location' ? 'active' : ''}`}
                    >
                      <span>📍</span> สถานที่ฉันดูแล
                    </button>
                  )}
                </div>

                <div className="location-filter">
                  <select
                    value={selectedFilterLocation}
                    onChange={(e) => {
                      setSelectedFilterLocation(e.target.value)
                      setFilterType('selected-location')
                    }}
                    className="filter-select"
                  >
                    <option value="">🏢 กรองตามหน่วยงาน</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  {selectedFilterLocation && (
                    <button 
                      onClick={() => {
                        setSelectedFilterLocation('')
                        setFilterType('all')
                      }}
                      className="clear-filter"
                    >
                      ✕ ล้างการกรอง
                    </button>
                  )}
                </div>
              </div>

              <div className="complaints-stats">
                <div className="stat-item">
                  <span className="stat-label">แสดง:</span>
                  <span className="stat-value">{filteredComplaints.length}</span>
                </div>
                <div className="stat-divider">|</div>
                <div className="stat-item">
                  <span className="stat-label">ทั้งหมด:</span>
                  <span className="stat-value">{complaints.length}</span>
                </div>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>กำลังโหลดข้อมูล...</p>
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h3>ไม่พบข้อมูล</h3>
                  <p>
                    {searchQuery || selectedFilterLocation 
                      ? 'ไม่พบเรื่องร้องเรียนที่ตรงกับเงื่อนไขการค้นหา' 
                      : 'ยังไม่มีเรื่องร้องเรียนในระบบ'}
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="complaints-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>หน่วยงาน</th>
                        <th>หัวข้อ</th>
                        <th>รายละเอียด</th>
                        <th>ผู้ส่ง</th>
                        <th>Officer</th>
                        <th>สิ่งที่ต้องแก้ไข</th>
                        <th>สถานะ</th>
                        <th>วันที่</th>
                        <th>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComplaints.map((c) => (
                        <>
                          <tr 
                            key={c.id} 
                            className={`complaint-row ${c.expanded ? 'expanded' : ''}`}
                            onClick={() => toggleExpand(c.id)}
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
        ) : (
          <div className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-icon">🔐</div>
              <h2>ยินดีต้อนรับสู่ระบบร้องเรียนแบบ Blockchain</h2>
              <p className="welcome-description">
                ระบบร้องเรียนที่ใช้เทคโนโลยี Blockchain เพื่อความโปร่งใสและไม่สามารถแก้ไขข้อมูลย้อนหลังได้
              </p>
              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon">🔒</div>
                  <h3>ปลอดภัย</h3>
                  <p>ข้อมูลถูกเข้ารหัสและบันทึกบน Blockchain</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">👁️</div>
                  <h3>โปร่งใส</h3>
                  <p>ติดตามความคืบหน้าได้แบบ Real-time</p>
                </div>
                <div className="feature-card">
                  <div className="feature-icon">⚡</div>
                  <h3>รวดเร็ว</h3>
                  <p>ส่งเรื่องและรับการตอบกลับอย่างทันท่วงที</p>
                </div>
              </div>
              <button onClick={connectWallet} className="btn-connect-large">
                <span>🔗</span> เชื่อมต่อ MetaMask เพื่อเริ่มใช้งาน
              </button>
              <p className="welcome-hint">
                💡 <strong>คำแนะนำ:</strong> คุณจะต้องติดตั้ง MetaMask Extension ในเบราว์เซอร์ของคุณก่อนใช้งาน
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Global Loading Overlay */}
      {(isSubmitting || loadingMessage) && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-animation">
              <div className="circular-spinner">
                <div className="spinner-segment segment-1"></div>
                <div className="spinner-segment segment-2"></div>
                <div className="spinner-segment segment-3"></div>
                <div className="spinner-segment segment-4"></div>
                <div className="spinner-segment segment-5"></div>
                <div className="spinner-segment segment-6"></div>
                <div className="spinner-segment segment-7"></div>
                <div className="spinner-segment segment-8"></div>
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