import { TutorialStep } from '@/stores/tutorial-store';

export const TUTORIAL_steps: Record<string, TutorialStep[]> = {
    overview: [
        {
            targetId: 'tutorial-overview-header',
            title: 'ยินดีต้อนรับสู่ศูนย์บัญชาการ',
            content: 'แดชบอร์ดนี้รวบรวมข้อมูลแบบเรียลไทม์จากทุกแพลตฟอร์มโฆษณาที่เชื่อมต่อ (Google, Facebook, TikTok ฯลฯ) เพื่อแสดงผลลัพธ์การตลาดของคุณในที่เดียว',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-checklist',
            title: 'สถานะระบบและการเชื่อมต่อ',
            content: 'ตรวจสอบให้แน่ใจว่าข้อมูลทำงานปกติ เช็คลิสต์นี้ตรวจสอบการเชื่อมต่อบัญชีโฆษณาและสถานะพิกเซลเพื่อความถูกต้องของข้อมูล 100%',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-overview-kpi',
            title: 'ตัวชี้วัดหลัก',
            content: 'ติดตามประสิทธิภาพแคมเปญหลักของคุณ เราติดตามค่าใช้จ่ายรวม, จำนวนการแสดงผล, คลิก และ Conversions เทียบกับช่วงก่อนหน้า',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-overview-ai-summary',
            title: 'AI วิเคราะห์เชิงกลยุทธ์',
            content: 'ใช้ AI วิเคราะห์ข้อมูลของคุณ ส่วนนี้สรุปผลประจำวัน ชี้จุดผิดปกติ และแนะนำการจัดสรรงบประมาณตามแนวโน้มประสิทธิภาพ',
            position: 'top'
        },
        {
            targetId: 'tutorial-overview-trend-chart',
            title: 'วิเคราะห์แนวโน้มการเติบโต',
            content: 'แสดงผลประสิทธิภาพตามช่วงเวลา สลับดูระหว่างค่าใช้จ่าย รายได้ และ Conversions เพื่อค้นหาแนวโน้มตามฤดูกาลและเชื่อมโยงกับแคมเปญ',
            position: 'inner-right'
        },
        {
            targetId: 'tutorial-overview-recent-campaigns',
            title: 'แคมเปญล่าสุด',
            content: 'ติดตามโฆษณาที่ใช้งานอยู่ ฟีดเรียลไทม์นี้จัดอันดับแคมเปญตามประสิทธิภาพ ช่วยให้คุณระบุโฆษณาที่ดีที่สุดและโฆษณาที่ต้องปรับปรุง',
            position: 'inner-top-left'
        },
        {
            targetId: 'tutorial-overview-financial',
            title: 'วิเคราะห์ความสามารถในการทำกำไร',
            content: 'ไม่ใช่แค่ "ค่าโฆษณา" ส่วนนี้คำนวณกำไรขั้นต้นโดยหักต้นทุนโฆษณาจากรายได้ ให้คุณเห็นผลกระทบจริงของการตลาด',
            position: 'inner-top-right'
        },
        {
            targetId: 'tutorial-overview-funnel',
            title: 'ภาพรวม Conversion Funnel',
            content: 'วินิจฉัย Customer Journey ของคุณ แสดง Conversion Rate ทุกขั้นตอนตั้งแต่การแสดงผลจนถึงการซื้อ ช่วยให้คุณระบุจุดที่เสียลูกค้า',
            position: 'inner-top-left'
        }
    ],
    campaigns: [
        {
            targetId: 'tutorial-campaigns-header',
            title: 'ศูนย์บัญชาการแคมเปญ',
            content: 'ควบคุมโฆษณาทั้งหมดจากจุดเดียว สร้างแคมเปญใหม่ ส่งออกรายงาน และจัดการกลยุทธ์ข้ามแพลตฟอร์มได้ที่นี่',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-campaigns-search',
            title: 'ค้นหาแม่นยำ',
            content: 'ค้นหาแคมเปญตามชื่อได้อย่างรวดเร็ว รองรับการค้นหาแบบ Fuzzy Search ช่วยให้คุณค้นพบสิ่งที่ต้องการในไม่กี่วินาที',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-campaigns-status-filter',
            title: 'กรองตามสถานะ',
            content: 'แยกแคมเปญตามสถานะ สลับดูระหว่าง กำลังใช้งาน หยุดชั่วคราว หรือ เสร็จสิ้น เพื่อโฟกัสการปรับปรุงในจุดที่สำคัญที่สุด',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-campaigns-selected-only',
            title: 'โหมดโฟกัส',
            content: 'ลดความซับซ้อน เลือกแคมเปญที่ต้องการจากตาราง แล้วกดปุ่มนี้เพื่อแสดงเฉพาะรายการที่เลือกไว้',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-campaigns-date-filter',
            title: 'ตัวกรองวันที่',
            content: 'ปรับช่วงเวลาการวิเคราะห์ สลับระหว่าง 7 วันล่าสุด เดือนล่าสุด หรือกำหนดช่วงเวลาเอง เพื่อค้นหาแนวโน้มและจุดผิดปกติ',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-campaigns-columns-button',
            title: 'ปรับแต่งคอลัมน์',
            content: 'เลือกตัวชี้วัดเพิ่มเติมเพื่อปรับแต่งมุมมองตามที่คุณต้องการ',
            position: 'left'
        },
        {
            targetId: 'tutorial-campaigns-list',
            title: 'รายการแคมเปญ',
            content: 'แต่ละแถวคือหนึ่งแคมเปญ ใช้เช็คบ็อกซ์สำหรับดำเนินการหลายรายการ หรือคลิกชื่อแคมเปญเพื่อดูรายงานประสิทธิภาพรายวัน',
            position: 'inner-bottom-right'
        },
        {
            targetId: 'tutorial-campaigns-summary',
            title: 'สรุปประสิทธิภาพ',
            content: 'ตัวชี้วัดรวมสำหรับรายการที่เลือก ดูต้นทุนรวม จำนวนการแสดงผล และคลิกทั้งหมดได้ทันทีโดยไม่ต้องคำนวณเอง',
            position: 'top'
        },
        {
            targetId: 'tutorial-campaigns-visualization-chart',
            title: 'กราฟแสดงแนวโน้ม',
            content: 'แสดงประสิทธิภาพการใช้งบประมาณ กราฟนี้เปรียบเทียบค่าใช้จ่าย รายได้ และงบประมาณ ช่วยให้เห็นว่าโฆษณาตัวไหนได้กำไร',
            position: 'right'
        },
        {
            targetId: 'tutorial-campaigns-visualization-highlights',
            title: 'ไฮไลท์สำคัญ',
            content: 'ดูผลลัพธ์เด่นได้ทันที แคมเปญ ROI สูงสุด ผู้ทำผลงานดีที่สุด และจำนวนแคมเปญที่ใช้งานอยู่ในสรุปผู้บริหาร',
            position: 'left'
        },
        {
            targetId: 'tutorial-campaigns-conversion-rate',
            title: 'วิเคราะห์ Conversion',
            content: 'ตัวชี้วัดความสำเร็จสุดท้าย การ์ดนี้เปรียบเทียบ Conversion Rate กับค่าเฉลี่ยของบัญชี บอกได้ทันทีว่าแคมเปญ "ชนะ" หรือ "ต้องปรับปรุง"',
            position: 'right'
        },
        {
            targetId: 'tutorial-campaigns-platform-breakdown',
            title: 'ROI แยกตามแพลตฟอร์ม',
            content: 'ดูว่างบประมาณทำงานดีที่สุดบนแพลตฟอร์มไหน เปรียบเทียบประสิทธิภาพ Facebook, Google, Line และ TikTok เพื่อจัดสรรงบใหม่',
            position: 'left'
        }
    ],
    ai_insights: [
        {
            targetId: 'tutorial-ai-detail-summary-card',
            title: 'สรุปรายละเอียด AI',
            content: 'วิเคราะห์เชิงลึกและรายงานเชิงกลยุทธ์',
            position: 'right'
        },
        {
            targetId: 'tutorial-ai-marketing-tools',
            title: 'เครื่องมือการตลาด',
            content: 'เครื่องมือลัดสำหรับโฆษณาและเนื้อหา',
            position: 'left'
        },
        {
            targetId: 'tutorial-ai-chat-input',
            title: 'ถาม AI ได้ทุกเรื่อง',
            content: 'พิมพ์คำถามหรือใช้คำสั่งเสียง',
            position: 'top'
        },
        {
            targetId: 'tutorial-ai-new-chat',
            title: 'แชทใหม่',
            content: 'คลิกเพื่อเริ่มบทสนทนาใหม่',
            position: 'top'
        },
        {
            targetId: 'tutorial-ai-summary-history',
            title: 'ประวัติแชท',
            content: 'เข้าถึงบทสนทนาที่ผ่านมา',
            position: 'left'
        }
    ],
    data_sources: [
        {
            targetId: 'tutorial-datasources-header',
            title: 'เชื่อมต่อแหล่งข้อมูล',
            content: 'ที่นี่คือจุดเชื่อมต่อบัญชีโฆษณาของคุณ เหมือนการเสียบปลั๊ก—เมื่อเชื่อมต่อแล้ว ข้อมูลจะไหลเข้ามาโดยอัตโนมัติ',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-datasource-card-google',
            title: 'แพลตฟอร์มโฆษณา',
            content: 'เหล่านี้คือบริการที่คุณใช้ลงโฆษณา เช่น Google หรือ Facebook คุณสามารถดูว่าตัวไหนพร้อมเชื่อมต่อได้ที่นี่',
            position: 'right'
        },
        {
            targetId: 'tutorial-datasource-connect-btn-google',
            title: 'เชื่อมต่อคลิกเดียว',
            content: 'แค่กด "เชื่อมต่อ" แล้วเข้าสู่ระบบด้วยบัญชีของคุณ เราจะจัดการดึงข้อมูลให้อย่างปลอดภัย',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-datasources-help',
            title: 'ปลอดภัยและมั่นคง',
            content: 'ความเป็นส่วนตัวของคุณเป็นสิ่งสำคัญ เราอ่านเฉพาะข้อมูลที่จำเป็นสำหรับการแสดงรายงานเท่านั้น',
            position: 'top'
        }
    ],
    seo: [
        {
            targetId: 'tutorial-seo-header',
            title: 'ศูนย์บัญชาการ SEO',
            content: 'ควบคุม Organic ทั้งหมด แดชบอร์ดนี้ติดตามอันดับ คุณภาพทราฟฟิก และความแข็งแกร่งของ Backlink ในที่เดียว',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-seo-overview',
            title: 'สรุปภาพรวม',
            content: 'ตรวจสุขภาพเว็บไซต์ทันที ติดตาม Organic Sessions, เป้าหมายที่สำเร็จ และเวลาเฉลี่ยบนหน้าเว็บ',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-seo-premium',
            title: 'คะแนนความน่าเชื่อถือ',
            content: 'พลังชื่อเสียงของคุณ เราติดตาม Domain Rating (DR) และ URL Rating (UR) เพื่อแสดงว่า Search Engine เห็นเว็บไซต์คุณน่าเชื่อถือแค่ไหน',
            position: 'bottom'
        },
        {
            targetId: 'tutorial-seo-chart',
            title: 'แนวโน้มทราฟฟิก',
            content: 'แสดงการเติบโต เปรียบเทียบ Organic Traffic กับเป้าหมายที่สำเร็จตามช่วงเวลา เพื่อพิสูจน์ ROI ของ SEO',
            position: 'top'
        },
        {
            targetId: 'tutorial-seo-keywords',
            title: 'คีย์เวิร์ดชนะ',
            content: 'ดูว่าอะไรดึงทราฟฟิก ตารางนี้จัดอันดับคีย์เวิร์ดตามปริมาณการค้นหาและตำแหน่ง ชี้ให้เห็นโอกาสที่ดีที่สุด',
            position: 'left'
        },
        {
            targetId: 'tutorial-seo-location',
            title: 'การเข้าถึงทั่วโลก',
            content: 'ผู้เยี่ยมชมของคุณมาจากไหน? ระบุประเทศและเมืองที่มีประสิทธิภาพดีที่สุดเพื่อปรับกลยุทธ์เนื้อหา',
            position: 'left'
        },
        {
            targetId: 'tutorial-seo-intent',
            title: 'ความตั้งใจของผู้ใช้',
            content: 'ถอดรหัส User Intent ผู้เยี่ยมชมต้องการข้อมูล (Informational) หรือพร้อมซื้อ (Transactional)? ใช้ข้อมูลนี้วางแผนเนื้อหา',
            position: 'left'
        },
        {
            targetId: 'tutorial-seo-anchor',
            title: 'โปรไฟล์ลิงก์',
            content: 'วิเคราะห์ Backlink ดูข้อความที่ใช้ลิงก์มาเว็บไซต์คุณมากที่สุด เพื่อให้แน่ใจว่าโปรไฟล์ลิงก์เป็นธรรมชาติและแข็งแรง',
            position: 'left'
        },
        {
            targetId: 'tutorial-seo-offpage',
            title: 'สุขภาพ Backlink',
            content: 'หัวใจของ SEO ติดตามจำนวน Backlink และ Referring Domains เพื่อให้แน่ใจว่ากลยุทธ์ Off-page กำลังเติบโต',
            position: 'top'
        }
    ]
};
