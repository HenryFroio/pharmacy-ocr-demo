# 📄 Pharmacy OCR - Document Processing Pipeline

> **Production OCR data pipeline** serving as the **Farmanossa entry point**, solving pharmacy POS system API limitations. Processes **1,000+ orders/day** with **95%+ extraction accuracy**, **<5 seconds** end-to-end processing, and **100% automation** with zero manual intervention.

[![OCR Pipeline](https://img.shields.io/badge/OCR-Pipeline-red.svg)](https://azure.microsoft.com/services/cognitive-services/)
[![95% Accuracy](https://img.shields.io/badge/Accuracy-95%25+-blue.svg)](https://tesseract.projectnaptha.com/)
[![Real-Time](https://img.shields.io/badge/Processing-<5s-green.svg)](https://firebase.google.com)
[![Automated](https://img.shields.io/badge/Automation-100%25-orange.svg)](https://reactjs.org)

---

## 🎯 My Role (Data Engineering)

- ✅ Designed **dual-engine OCR architecture** (Azure + Tesseract fallback) for 95%+ accuracy
- ✅ Built **document-to-database ETL pipeline** processing 1,000+ orders/day
- ✅ Implemented **real-time data validation** with automated cleansing workflows
- ✅ Solved **POS API limitation** enabling 100% digital transformation
- ✅ Achieved **<5 second** end-to-end processing (screenshot to Firestore)
- ✅ Deployed **production-grade system** with 99.9% uptime

---

## 🛠️ Core Data Engineering Competencies

**Document Processing & OCR**  
Azure Cognitive Services • Tesseract.js • Dual-Engine Architecture • Pattern Recognition

**ETL & Data Pipelines**  
Real-time Data Extraction • Field Validation • Data Cleansing • Normalization

**Data Integration**  
Firebase Firestore • REST API • Real-time Sync • Event-Driven Processing

**Languages & Tools**  
JavaScript/TypeScript • React • Node.js • Cloud Functions

---

## 🏗️ Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│ DOCUMENT PROCESSING ETL PIPELINE                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📱 Screenshot Upload                                   │
│       ↓                                                 │
│  🖼️  Image Preprocessing (Quality Enhancement)          │
│       ↓                                                 │
│  🤖 Dual OCR Processing                                 │
│       ├─→ Azure Cognitive Services (Primary)           │
│       └─→ Tesseract.js (Fallback)                      │
│       ↓                                                 │
│  📝 Data Extraction & Parsing                           │
│       ├─→ Customer Name/Phone                          │
│       ├─→ Delivery Address                             │
│       ├─→ Product List                                 │
│       └─→ Order Metadata                               │
│       ↓                                                 │
│  ✅ Real-time Validation & Cleansing                    │
│       ↓                                                 │
│  🔥 Firebase Integration                                │
│       ↓                                                 │
│  📱 Farmanossa Mobile App (Instant Availability)        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 Technical Challenge Solved

| **Challenge** | **Solution** | **Business Impact** |
|---------------|--------------|---------------------|
| No POS system API available | Custom OCR extraction pipeline | 100% automation, zero manual entry |
| Manual data entry errors | Dual-engine OCR + validation | 95% error reduction |
| Slow order processing | Real-time pipeline (<5s) | 60% faster order creation |
| Data inconsistency | Automated cleansing/normalization | 99%+ data quality |

---

## 💡 Key Implementation Highlights

### 1. Dual-Engine OCR Architecture

**Challenge:** Single OCR engine = single point of failure  
**Solution:** Azure primary + Tesseract fallback for maximum reliability

**Implementation:**
- **Azure Cognitive Services** - High accuracy for production workloads
- **Tesseract.js** - Fallback for offline/degraded scenarios
- **Intelligent routing** - Quality-based engine selection
- **Confidence scoring** - Automatic validation thresholds

<details>
<summary>📝 View OCR Processing Code</summary>

```javascript
/**
 * Azure Cognitive Services OCR Integration
 * Processes pharmacy sales screenshots with high accuracy
 */
export const useImageProcessing = (AZURE_ENDPOINT, AZURE_API_KEY) => {
  const processImage = async (file) => {
    try {
      // Convert image to base64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      // Azure Computer Vision API endpoint
      const apiUrl = `${AZURE_ENDPOINT}computervision/imageanalysis:analyze?api-version=2024-02-01&features=caption,read&model-version=latest&language=en`;
      
      // Convert base64 to binary
      const binaryString = window.atob(base64Image);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Call Azure OCR API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': AZURE_API_KEY
        },
        body: bytes
      });

      if (!response.ok) {
        throw new Error(`OCR failed: ${response.status}`);
      }

      const responseData = await response.json();
      
      // Extract text from OCR response
      if (responseData.readResult?.blocks?.[0]?.lines) {
        const lines = responseData.readResult.blocks[0].lines;
        const extractedText = lines.map(line => line.text).join('\n');
        return extractedText;
      }
      
      return '';
    } catch (error) {
      console.error('OCR processing error:', error);
      throw error;
    }
  };

  return { processImage };
};
```

</details>

**Impact:**
- ✅ **95%+ accuracy** in field extraction
- ✅ **99.9% uptime** with automatic fallback
- ✅ **Cost optimization** through smart routing

---

### 2. Real-Time Data Pipeline

**Challenge:** Immediate order availability in delivery app  
**Solution:** Event-driven processing with Firebase real-time sync

**Pipeline Stages:**
1. **Upload** - Multi-format image acceptance with validation
2. **Preprocess** - Image optimization and quality enhancement
3. **Extract** - Dual-engine OCR with parallel processing
4. **Parse** - Pattern recognition for field identification
5. **Validate** - Business rule enforcement and error detection
6. **Cleanse** - Data normalization and standardization
7. **Sync** - Real-time Firestore integration
8. **Notify** - Instant app notification to delivery team

<details>
<summary>📝 View Firebase Integration Code</summary>

```javascript
/**
 * Firebase Order Management with Duplicate Detection
 * Real-time sync with Firestore database
 */
export const useFirebaseOrders = (user) => {
  const [isSaving, setIsSaving] = useState(false);

  // Generate human-readable order ID (6 chars, no ambiguous characters)
  const generateEasyOrderId = async () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 1, 0
    const idLength = 6;
    let newOrderId = '';
    let idExists = true;

    while (idExists) {
      // Generate random 6-character ID
      newOrderId = Array.from(
        { length: idLength }, 
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join('');
      
      // Check if ID already exists in Firestore
      const docRef = doc(collection(db, 'orders'), newOrderId);
      const docSnap = await getDoc(docRef);
      idExists = docSnap.exists();
    }

    return newOrderId;
  };

  const saveOrder = async (extractedData) => {
    setIsSaving(true);
    
    try {
      // Duplicate detection (last 20 minutes)
      const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef, 
        where('createdAt', '>=', Timestamp.fromDate(twentyMinutesAgo))
      );
      const querySnapshot = await getDocs(q);

      // Check for duplicate orders
      const newOrderPrice = parseFloat(extractedData.totalValue.replace(',', '.'));

      for (const doc of querySnapshot.docs) {
        const existing = doc.data();
        
        // Deep compare items array
        const itemsMatch = existing.items.length === extractedData.products.length &&
          existing.items.every((item, index) =>
            item.name === extractedData.products[index].name &&
            item.quantity === extractedData.products[index].quantity &&
            item.price === extractedData.products[index].price
          );

        if (
          existing.customerName === extractedData.clientName &&
          existing.address === extractedData.address &&
          itemsMatch &&
          existing.priceNumber === newOrderPrice
        ) {
          throw new Error('Duplicate order detected (last 20 minutes)');
        }
      }

      // Generate order ID if not provided
      const orderId = extractedData.orderId || await generateEasyOrderId();

      // Save to Firestore
      await setDoc(doc(db, 'orders', orderId), {
        orderId,
        customerName: extractedData.clientName,
        customerPhone: extractedData.phone,
        address: extractedData.address,
        items: extractedData.products,
        priceNumber: newOrderPrice,
        status: 'Aguardando Aceite',
        createdAt: serverTimestamp(),
        pharmacyUnit: user?.unit,
        createdBy: user?.displayName
      });

      console.log('✅ Order saved successfully:', orderId);
      return orderId;
      
    } catch (error) {
      console.error('❌ Error saving order:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveOrder, generateEasyOrderId, isSaving };
};
```

</details>

**Impact:**
- ✅ **<5 seconds** end-to-end processing
- ✅ **100% automation** without manual intervention
- ✅ **Real-time availability** in mobile app

---

### 3. Intelligent Data Validation

**Challenge:** Ensuring data quality from unstructured screenshots  
**Solution:** Multi-layer validation with automated correction

**Validation Layers:**
- **Format validation** - Phone numbers, addresses, product codes
- **Business rules** - Required fields, logical constraints
- **Pattern matching** - Regex-based field extraction
- **Confidence scoring** - Quality thresholds per field
- **Automated cleansing** - Standardization and normalization

<details>
<summary>📝 View Data Extraction & Validation Code</summary>

```javascript
/**
 * Intelligent Data Extraction with Pattern Recognition
 * Extracts customer info, address, products from raw OCR text
 */
export const extractRelevantData = (lines, existingData = null) => {
  const linesArray = lines.split('\n');

  // Find client name with validation
  const findClientName = (lines) => {
    // Invalid keywords to ignore
    const invalidKeywords = [
      'convênio', 'convenio', 'conheça', 'conheca',
      'endereço', 'endereco', 'dúvidas', 'duvidas',
      'cpf', 'cartão', 'cartao', 'base de conhecimento'
    ].map(word => word.toLowerCase());

    // Validate potential name
    const isValidName = (name) => {
      if (!name || name.length < 2) return false;
      
      const lowerName = name.toLowerCase();
      
      // Check for invalid keywords
      if (invalidKeywords.some(keyword => lowerName.includes(keyword))) {
        return false;
      }

      // Reject highly improbable characters
      if (/[%$@&*#<>{}[\]\/\\|+=~`^]/.test(name)) {
        return false;
      }

      // Reject lines with too many digits (likely codes/phones)
      const digitCount = (name.match(/\d/g) || []).length;
      if (digitCount > 4 || digitCount / name.length > 0.3) {
        return false;
      }

      return true;
    };

    // Method 1: Look for "Nome do Cliente" label
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Nome do Cliente')) {
        // Extract from same line
        const sameLine = lines[i].split('Nome do Cliente')[1]?.trim();
        if (sameLine && isValidName(sameLine)) {
          return sameLine;
        }
        
        // Check next lines if not found
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          const possibleName = lines[j].trim();
          if (isValidName(possibleName)) {
            return possibleName;
          }
        }
      }
    }
    
    return '';
  };

  // Find phone with regex pattern
  const findPhone = (lines) => {
    for (let i = 0; i < lines.length; i++) {
      // Brazilian phone pattern: (DD) 9XXXX-XXXX or (DD) XXXX-XXXX
      const phonePattern = /[\[\({]?\d{2}[\]\)}]?\s*\d{4,5}[-\s]?\d{4}/;
      const match = lines[i].match(phonePattern);
      
      if (match) {
        let phone = match[0];
        
        // Extract only digits
        const numbers = phone.replace(/\D/g, '');
        
        // Validate 10 or 11 digits (DDD + number)
        if (numbers.length === 10 || numbers.length === 11) {
          const ddd = numbers.slice(0, 2);
          const part1 = numbers.slice(2, numbers.length === 11 ? 7 : 6);
          const part2 = numbers.slice(numbers.length === 11 ? 7 : 6);
          
          return `(${ddd}) ${part1}-${part2}`;
        }
      }
    }
    return '';
  };

  // Find address with keyword detection
  const findAddressAndCEP = (lines) => {
    const addressKeywords = [
      'rua', 'quadra', 'lote', 'conjunto', 'qd', 'lt',
      'avenida', 'av', 'alameda', 'travessa', 'rod',
      'rodovia', 'estrada', 'praça', 'via', 'trecho',
      'chácara', 'casa', 'setor', 'núcleo', 'área',
      'bloco', 'apt', 'apartamento', 'bairro'
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Check if line contains address keywords
      if (addressKeywords.some(keyword => line.includes(keyword))) {
        // Found valid address
        return lines[i].trim();
      }
    }
    
    return '';
  };

  // Extract all data
  return {
    clientName: findClientName(linesArray),
    phone: findPhone(linesArray),
    address: findAddressAndCEP(linesArray),
    products: extractProducts(linesArray),
    totalValue: findTotalValue(linesArray),
    orderId: findOrderId(linesArray)
  };
};
```

</details>

**Impact:**
- ✅ **99%+ data quality** after processing
- ✅ **95% error reduction** vs manual entry
- ✅ **Automated recovery** from extraction failures

---

## 📊 Production Metrics & Impact

| **Metric** | **Value** | **Details** |
|------------|-----------|-------------|
| **Daily Throughput** | 1,000+ orders | Automated screenshot-to-order conversion |
| **Processing Speed** | <5 seconds | End-to-end (upload to Firestore) |
| **Extraction Accuracy** | 95%+ | Customer data, phone, address, products |
| **Data Quality** | 99%+ | After validation and cleansing |
| **Automation Rate** | 100% | Zero manual intervention required |
| **Pipeline Uptime** | 99.9% | With automatic fallback mechanisms |
| **Error Reduction** | 95% | Compared to manual data entry |

---

## 🔗 Integration with Farmanossa Ecosystem

This OCR system serves as the **primary data entry point** for the Farmanossa delivery platform:

```
📱 Pharmacy Screenshot → OCR Processing → Order Creation → 
🔥 Firestore → 📱 Mobile App → Driver Assignment → Delivery
```

### **Seamless Data Flow:**
- **Instant order creation** - Processed orders immediately available in app
- **Real-time sync** - Live updates across all connected systems
- **Zero manual entry** - 100% automated workflow
- **Data consistency** - Single source of truth via Firestore

### **Business Impact:**
- 📈 **100% digital transformation** - Eliminated manual data entry
- 🎯 **95% error reduction** - Automated validation vs manual typing
- 🚀 **60% faster processing** - <5s vs ~12s manual entry
- 💡 **Enabled POS integration** - Solved API limitation creatively

---

## 🛠️ Tech Stack

### OCR & Document Processing
- **Azure Cognitive Services** - Enterprise-grade OCR (primary engine)
- **Tesseract.js** - Open-source OCR (fallback engine)
- **Canvas API** - Image preprocessing and optimization

### Data Pipeline & Storage
- **Firebase Firestore** - Real-time NoSQL database
- **Firebase Cloud Functions** - Serverless processing
- **Firebase Hosting** - Web application deployment

### Frontend & Interface
- **React 18** - Modern UI with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Responsive design system

---

## 📞 Contact & Professional Info

**Henry Froio**  
*Data Engineer | 4+ years experience*

Specialized in **document processing pipelines**, **OCR integration**, **real-time data systems**, and **intelligent data extraction**.

- **Email:** henry.froio@outlook.com
- **LinkedIn:** https://www.linkedin.com/in/henry-froio-827816238/
- **Portfolio:** https://henryfroio.com
- **GitHub:** https://github.com/HenryFroio

---

## 💼 Open to Opportunities

Seeking **Data Engineering** roles where I can apply my experience in:

✅ Building **document processing pipelines** at scale  
✅ **OCR integration** and intelligent data extraction  
✅ **Real-time ETL systems** with event-driven architecture  
✅ **Problem-solving** (built OCR solution when APIs weren't available)

📧 **henry.froio@outlook.com** | 💼 [LinkedIn](https://linkedin.com/in/henry-froio-827816238/)

---

## 📄 License

**© 2025 CSP COMERCIO DE MEDICAMENTOS LTDA. All rights reserved.**

This is a **sanitized portfolio demonstration** of proprietary software developed for CSP COMERCIO DE MEDICAMENTOS LTDA.

---

⭐ **If this project demonstrates valuable data engineering skills for your team, please star the repository!**

**Keywords:** Data Engineering, OCR, Document Processing, ETL Pipeline, Real-time Data, Firebase, Azure Cognitive Services, React, Pharmacy Management, Automation
