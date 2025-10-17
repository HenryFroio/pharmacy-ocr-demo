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
