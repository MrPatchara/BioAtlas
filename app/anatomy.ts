import type {Lang} from '@/lib/i18n';
export type SystemId = 'skeletal'|'muscular'|'arterial'|'venous'|'nervous'|'digestive'|'respiratory'|'urinary'|'reproductive'|'lymphatic'|'endocrine'|'integumentary'|'connective'|'sensory'|'cardiac';
export const SYSTEMS: {id:SystemId;name:string;nameTh:string;color:string;description:string;descriptionTh:string}[] = [
 {id:'skeletal',name:'Skeleton',nameTh:'ระบบโครงกระดูก',color:'#e2d9ba',description:'Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.',descriptionTh:'กระดูกเป็นโครงร่างค้ำจุนร่างกาย ปกป้องอวัยวะ และเป็นจุดเกาะของกล้ามเนื้อ เนื้อเยื่อภายในยังสะสมแร่ธาตุและสร้างเซลล์เม็ดเลือด'},
 {id:'muscular',name:'Muscles',nameTh:'ระบบกล้ามเนื้อ',color:'#a85b50',description:'Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.',descriptionTh:'กล้ามเนื้อลายสร้างการเคลื่อนไหวโดยดึงจุดเกาะ ร่วมกับเอ็นทำให้ข้อต่อขยับ ทรงตัว และสร้างความร้อน'},
 {id:'cardiac',name:'Heart',nameTh:'หัวใจ',color:'#b96760',description:'The heart is a muscular pump with four chambers. Its valves direct blood forward through the pulmonary and systemic circuits.',descriptionTh:'หัวใจเป็นปั๊มกล้ามเนื้อสี่ห้อง ลิ้นหัวใจบังคับเลือดไปข้างหน้าผ่านวงจรปอดและร่างกาย'},
 {id:'sensory',name:'Sensory organs',nameTh:'อวัยวะรับความรู้สึก',color:'#b0c8ce',description:'These structures contribute to special senses, including sight, hearing, and balance. Their specialized tissues detect stimuli and work with the nervous system to convey information.',descriptionTh:'โครงสร้างเหล่านี้ทำหน้าที่รับความรู้สึกพิเศษ ได้แก่ การมองเห็น การได้ยิน และการทรงตัว เนื้อเยื่อเฉพาะรับสิ่งเร้าแล้วส่งข้อมูลผ่านระบบประสาท'},
 {id:'arterial',name:'Arteries',nameTh:'หลอดเลือดแดง',color:'#c05245',description:'The heart drives blood through the circulation. Arteries carry blood away from the heart to supply tissues or, in the pulmonary circuit, to the lungs.',descriptionTh:'หัวใจปั๊มเลือดไปทั่วร่างกาย หลอดเลือดแดงนำเลือดออกจากหัวใจไปเลี้ยงเนื้อเยื่อ หรือไปปอดในวงจรปอด'},
 {id:'venous',name:'Veins',nameTh:'หลอดเลือดดำ',color:'#527c9f',description:'Veins return blood toward the heart. Superficial and deep networks collect blood from the tissues; the pulmonary veins bring oxygenated blood back from the lungs.',descriptionTh:'หลอดเลือดดำนำเลือดกลับสู่หัวใจ ทั้งเครือข่ายตื้นและลึก ส่วนหลอดเลือดดำปอดนำเลือดมีออกซิเจนกลับจากปอด'},
 {id:'nervous',name:'Nervous system',nameTh:'ระบบประสาท',color:'#d8b565',description:'The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions.',descriptionTh:'สมอง ไขสันหลัง และเส้นประสาทนำและประมวลผลสัญญาณ ควบคุมความรู้สึก การเคลื่อนไหว การประสานงาน และการทำงานอัตโนมัติของร่างกาย'},
 {id:'respiratory',name:'Respiratory',nameTh:'ระบบหายใจ',color:'#b98991',description:'The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.',descriptionTh:'ทางเดินหายใจนำอากาศสู่ปอด ซึ่งออกซิเจนและคาร์บอนไดออกไซด์แลกเปลี่ยนกับเลือด การหายใจอาศัยความดันที่เปลี่ยนโดยกล้ามเนื้อหายใจ'},
 {id:'digestive',name:'Digestive',nameTh:'ระบบย่อยอาหาร',color:'#b8916b',description:'The digestive tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.',descriptionTh:'ทางเดินอาหารย่อยอาหาร ดูดซึมสารอาหารและน้ำ แล้วขับกากออก อวัยวะเสริมสร้างน้ำดีและเอนไซม์ย่อยอาหาร'},
 {id:'urinary',name:'Urinary',nameTh:'ระบบทางเดินปัสสาวะ',color:'#b47961',description:'The kidneys filter blood and regulate fluid, electrolyte, and acid–base balance. Urine travels through the ureters to the bladder and exits through the urethra.',descriptionTh:'ไตกรองเลือดและควบคุมสมดุลน้ำ เกลือแร่ และกรด-ด่าง ปัสสาวะไหลผ่านท่อไตสู่กระเพาะปัสสาวะแล้วออกทางท่อปัสสาวะ'},
 {id:'lymphatic',name:'Lymphatic',nameTh:'ระบบน้ำเหลือง',color:'#879f7c',description:'Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes and other lymphoid organs support immune surveillance and responses.',descriptionTh:'หลอดน้ำเหลืองนำของเหลวส่วนเกินกลับสู่กระแสเลือด ต่อมน้ำเหลืองและอวัยวะน้ำเหลืองช่วยเฝ้าระวังและตอบสนองภูมิคุ้มกัน'},
 {id:'endocrine',name:'Endocrine',nameTh:'ระบบต่อมไร้ท่อ',color:'#c5a09a',description:'Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.',descriptionTh:'ต่อมไร้ท่อหลั่งฮอร์โมนเข้ากระแสเลือดเพื่อประสานกระบวนการต่างๆ เช่น เมแทบอลิซึม การเติบโต การตอบสนองความเครียด และการสืบพันธุ์'},
 {id:'reproductive',name:'Reproductive',nameTh:'ระบบสืบพันธุ์',color:'#bda098',description:'The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.',descriptionTh:'โครงสร้างสืบพันธุ์เพศชายที่แสดงนี้ทำหน้าที่สร้าง บ่มเพาะ และขนส่งอสุจิ รวมทั้งสร้างฮอร์โมนเพศ'},
 {id:'integumentary',name:'Body surface',nameTh:'ผิวกาย',color:'#ba9b7d',description:'The body surface provides an outer anatomical reference. The integumentary system forms a protective barrier and contributes to sensation and temperature regulation.',descriptionTh:'ผิวกายเป็นจุดอ้างอิงภายนอก ระบบผิวหนังเป็นเกราะป้องกันและช่วยรับความรู้สึกกับควบคุมอุณหภูมิ'},
 {id:'connective',name:'Connective tissue',nameTh:'เนื้อเยื่อเกี่ยวพัน',color:'#aec3bb',description:'Cartilage, ligaments, and other connective tissues support, connect, and separate structures. Their roles include stabilizing joints and distributing mechanical loads.',descriptionTh:'กระดูกอ่อน เอ็นยึดข้อ และเนื้อเยื่อเกี่ยวพันช่วยค้ำจุน เชื่อม และแยกโครงสร้าง ทำหน้าที่ยึดข้อต่อและกระจายแรง'},
];
export interface Part {id:string;name:string;conceptId:string;system:SystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[number[],number[]]}
export interface Concept {id:string;name:string;elements:string[]}
export interface Atlas {version:string;sex?:'male';source?:string;scope?:string;parts:Part[];concepts:Concept[];chunks:{url:string;bytes:number;gzip?:string;gzipBytes?:number}[];triangles:number}
export type View = 'three-quarter'|'front'|'back'|'side';
export interface SceneState {inspectorOpen?:boolean;explode:number;visible:SystemId[];selected:string[];isolate:boolean;view:View;rotate:boolean;reset:number}
export const DEFAULT_VISIBLE:SystemId[] = ['cardiac','sensory','skeletal','muscular','arterial','venous','nervous','respiratory','digestive','urinary','lymphatic','endocrine','reproductive','connective'];
export const EXPLANATIONS:Record<string,string> = {
 'heart':'A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.',
 'liver':'A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.',
 'brain':'The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.',
 'stomach':'A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.',
 'spleen':'A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.',
 'pancreas':'An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.',
 'urinary bladder':'A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.',
 'trachea':'The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.',
 'diaphragm':'A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.',
};
export function explanation(name:string,system:SystemId){return EXPLANATIONS[name.toLowerCase()] ?? SYSTEMS.find(s=>s.id===system)?.description ?? '';}
export function explanationTh(name:string,system:SystemId){return EXPLANATIONS_TH[name.toLowerCase()] ?? SYSTEMS.find(s=>s.id===system)?.descriptionTh ?? '';}
export function sysName(id:SystemId,lang:Lang){return lang==='th'?SYSTEMS.find(s=>s.id===id)?.nameTh ?? id:SYSTEMS.find(s=>s.id===id)?.name ?? id;}
export const EXPLANATIONS_TH:Record<string,string> = {
 'heart':'ปั๊มกล้ามเนื้อในช่องอก ซีกขวาส่งเลือดไปปอด ซีกซ้ายส่งเลือดไปทั่วร่างกาย',
 'liver':'อวัยวะขนาดใหญ่ใต้กระบังลมขวา แปรรูปสารอาหารที่ดูดซึม สร้างน้ำดี และสังเคราะห์โปรตีนในเลือดหลายชนิด',
 'brain':'อวัยวะกลางของระบบประสาท เครือข่ายบริเวณต่างๆ รองรับการรับรู้ การเคลื่อนไหว ความจำ ภาษา และการควบคุมการทำงานของร่างกาย',
 'stomach':'ห้องกล้ามเนื้อระหว่างหลอดอาหารกับลำไส้เล็ก เก็บและคลุกอาหารกับกรดและเอนไซม์ก่อนปล่อยสู่ลำไส้เล็กส่วนต้น',
 'spleen':'อวัยวะน้ำเหลืองในช่องท้องซ้ายบน กรองเลือด กำจัดเม็ดเลือดเก่า และร่วมตอบสนองภูมิคุ้มกัน',
 'pancreas':'อวัยวะช่องท้องทำหน้าที่ย่อยอาหารและไร้ท่อ ส่งเอนไซม์ไปลำไส้เล็กและหลั่งฮอร์โมนรวมถึงอินซูลินและกลูคากอน',
 'urinary bladder':'กระเพาะกล้ามเนื้อในเชิงกราน เก็บปัสสาวะที่มาจากไตผ่านท่อไต',
 'trachea':'ทางเดินหายใจหลักเชื่อมกล่องเสียงกับหลอดลม กระดูกอ่อนช่วยค้ำให้ทางเดินเปิดขณะหายใจ',
 'diaphragm':'กล้ามเนื้อแผ่นกว้างกั้นช่องอกกับช่องท้อง เมื่อหดตัวจะเพิ่มปริมาตรช่องอกและดึงอากาศเข้าปอด',
};
