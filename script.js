const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// ✅ المتغيرات العامة
let productsData = [];
let salesRepresentatives = [];
let customersMain = [];
let visitOutcomes = [];
let visitPurposes = [];
let visitTypes = [];
let inventoryProducts = [];

const visitForm = document.getElementById('visitForm');
const visitTypeSelect = document.getElementById('visitType');
const salesRepNameSelect = document.getElementById('salesRepName');
const customerNameInput = document.getElementById('customerName');
const customerListDatalist = document.getElementById('customerList');
const visitPurposeSelect = document.getElementById('visitPurpose');
const visitOutcomeSelect = document.getElementById('visitOutcome');
const productCategoriesDiv = document.getElementById('productCategories');
const productsDisplayDiv = document.getElementById('productsDisplay');
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

const inventorySection = document.getElementById('inventorySection');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');

// ✅ رسائل SweetAlert
function showSuccessMessage() {
  Swal.fire({ title: '✅ تم الإرسال!', text: 'تم إرسال النموذج بنجاح.', icon: 'success', confirmButtonText: 'ممتاز' });
}
function showErrorMessage(msg) {
  Swal.fire({ title: '❌ فشل الإرسال', text: msg || 'حدث خطأ أثناء إرسال النموذج.', icon: 'error', confirmButtonText: 'موافق' });
}
function showWarningMessage(msg) {
  Swal.fire({ title: '⚠️ تنبيه', text: msg, icon: 'warning', confirmButtonText: 'موافق' });
}

// ✅ أدوات مساعدة
function generateVisitID() {
  return `VISIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}
function formatDate(d) {
  return d.toLocaleDateString('ar-SA');
}
function formatTime(d) {
  return d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
function formatTimestamp(d) {
  return d.toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ✅ تحميل ملفات JSON
async function fetchJsonData(url) {
  try {
    const res = await fetch(url);
    return res.ok ? await res.json() : [];
  } catch (err) {
    console.error(`خطأ في تحميل ${url}:`, err);
    showErrorMessage(`تعذر تحميل ${url}`);
    return [];
  }
}

// ✅ تعبئة القوائم
async function loadAllData() {
  [
    productsData,
    salesRepresentatives,
    customersMain,
    visitOutcomes,
    visitPurposes,
    visitTypes,
    inventoryProducts
  ] = await Promise.all([
    fetchJsonData('products.json'),
    fetchJsonData('sales_representatives.json'),
    fetchJsonData('customers_main.json'),
    fetchJsonData('visit_outcomes.json'),
    fetchJsonData('visit_purposes.json'),
    fetchJsonData('visit_types.json'),
    fetchJsonData('inventory_products.json')
  ]);

  populateSelect(salesRepNameSelect, salesRepresentatives);
  populateSelect(visitOutcomeSelect, visitOutcomes);
  populateSelect(visitPurposeSelect, visitPurposes);
  populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR');
  populateCustomerDatalist();
  setupProductCategories();
}

function populateSelect(selectElement, data, key = null) {
  selectElement.innerHTML = '<option value="">اختر</option>';
  data.forEach(item => {
    const val = key ? item[key] : item;
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = val;
    selectElement.appendChild(opt);
  });
}

function populateCustomerDatalist() {
  customerListDatalist.innerHTML = '';
  customersMain.forEach(cust => {
    const opt = document.createElement('option');
    opt.value = cust.Customer_Name_AR;
    customerListDatalist.appendChild(opt);
  });
}

// ✅ المنتجات حسب التصنيف
let productCategories = {};
function setupProductCategories() {
  productCategoriesDiv.innerHTML = '';
  productCategories = {};

  productsData.forEach(p => {
    if (!productCategories[p.Category]) productCategories[p.Category] = [];
    productCategories[p.Category].push(p);
  });

  Object.keys(productCategories).forEach(cat => {
    const id = `cat-${cat.replace(/\s/g, '-')}`;
    const div = document.createElement('div');
    div.className = 'flex items-center';
    div.innerHTML = `
      <input type="checkbox" id="${id}" value="${cat}" class="h-5 w-5 cursor-pointer">
      <label for="${id}" class="ml-2 text-sm">${cat}</label>
    `;
    productCategoriesDiv.appendChild(div);
    div.querySelector('input').addEventListener('change', e => toggleProductsDisplay(cat, e.target.checked));
  });
}

function toggleProductsDisplay(category, isChecked) {
  const products = productCategories[category];
  if (!products) return;
  if (isChecked) {
    products.forEach(prod => {
      const id = `product-${Math.random().toString(36).substring(2, 6)}`;
      const div = document.createElement('div');
      div.className = 'product-item';
      div.setAttribute('data-category', category);
      div.innerHTML = `
        <label>${prod.Product_Name_AR}</label>
        <div class="radio-group">
          <label><input type="radio" name="status-${id}" value="متوفر" required> متوفر</label>
          <label><input type="radio" name="status-${id}" value="غير متوفر" required> غير متوفر</label>
        </div>
      `;
      productsDisplayDiv.appendChild(div);
    });
  } else {
    productsDisplayDiv.querySelectorAll(`[data-category="${category}"]`).forEach(e => e.remove());
  }
}

function validateProductStatuses() {
  const items = productsDisplayDiv.querySelectorAll('.product-item');
  let valid = true;
  items.forEach(div => {
    const checked = div.querySelector('input[type="radio"]:checked');
    if (!checked) {
      div.style.border = '2px solid red';
      div.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => div.style.border = '', 3000);
      valid = false;
    }
  });
  if (!valid) showWarningMessage('يرجى تحديد حالة كل منتج.');
  return valid;
}
// ✅ إظهار قسم الجرد عند اختيار "جرد استثنائي"
visitTypeSelect.addEventListener('change', () => {
  const selectedType = visitTypeSelect.value;
  const isInventory = selectedType === 'جرد استثنائي';

  const customerTypeDiv = document.getElementById('customerType').parentElement;
  const visitPurposeDiv = visitPurposeSelect.parentElement;
  const visitOutcomeDiv = visitOutcomeSelect.parentElement;
  const notesDiv = document.getElementById('notes').parentElement;
  const productSelectionDiv = document.querySelector('.product-selection-section');

  if (isInventory) {
    inventorySection.classList.remove('hidden');
    customerTypeDiv.classList.add('hidden');
    visitPurposeDiv.classList.add('hidden');
    visitOutcomeDiv.classList.add('hidden');
    notesDiv.classList.add('hidden');
    productSelectionDiv.classList.add('hidden');
    inventoryItemsContainer.innerHTML = '';
    loadInventoryProducts();
  } else {
    inventorySection.classList.add('hidden');
    customerTypeDiv.classList.remove('hidden');
    visitPurposeDiv.classList.remove('hidden');
    visitOutcomeDiv.classList.remove('hidden');
    notesDiv.classList.remove('hidden');
    productSelectionDiv.classList.remove('hidden');
    inventoryItemsContainer.innerHTML = '';
  }
});

// ✅ تحميل المنتجات من ملف inventory_products.json
function loadInventoryProducts() {
  const datalist = document.getElementById('inventoryList');
  datalist.innerHTML = '';
  inventoryProducts.forEach(prod => {
    const option = document.createElement('option');
    option.value = prod.Product_Name_AR;
    datalist.appendChild(option);
  });
}

// ✅ إضافة منتج جرد جديد
addInventoryItemBtn.addEventListener('click', () => {
  const item = document.createElement('div');
  item.className = 'inventory-item border border-yellow-200 p-4 rounded-lg bg-white relative';
  item.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-group">
        <label>البحث عن المنتج</label>
        <input type="text" name="Inventory_Product_Name_AR" list="inventoryList" placeholder="ابحث..." required />
      </div>
      <div class="form-group">
        <label>الكمية</label>
        <input type="number" name="Inventory_Quantity" min="1" placeholder="أدخل الكمية" required />
      </div>
      <div class="form-group">
        <label>تاريخ الانتهاء</label>
        <input type="date" name="Expiration_Date" />
      </div>
      <div class="form-group">
        <label>الوحدة</label>
        <select name="Unit_Label" required>
          <option value="">اختر الوحدة</option>
          <option value="علبة">علبة</option>
          <option value="شد">شد</option>
          <option value="باكت">باكت</option>
        </select>
      </div>
    </div>
    <button type="button" class="removeInventoryItem absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>
  `;
  inventoryItemsContainer.appendChild(item);
});

// ✅ حذف منتج جرد
inventoryItemsContainer.addEventListener('click', e => {
  if (e.target.classList.contains('removeInventoryItem')) {
    e.target.parentElement.remove();
  }
});
async function handleSubmit(event) {
  event.preventDefault();
  if (!visitForm.checkValidity()) {
    visitForm.reportValidity();
    showWarningMessage('يرجى تعبئة جميع الحقول المطلوبة.');
    return;
  }

  submitBtn.disabled = true;
  loadingSpinner.classList.remove('hidden');

  const formData = new FormData(visitForm);
  const visitType = formData.get('Visit_Type_Name_AR');
  const now = new Date();

  let payload = {};

  if (visitType === 'جرد استثنائي') {
    // ✅ إعداد بيانات الجرد Inventory_Logs
    const inventoryItems = inventoryItemsContainer.querySelectorAll('.inventory-item');
    if (inventoryItems.length === 0) {
      showWarningMessage('يرجى إضافة منتج واحد على الأقل في الجرد.');
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    const allInventoryData = [];
    let invalid = false;

    inventoryItems.forEach(item => {
      const productName = item.querySelector('input[name="Inventory_Product_Name_AR"]').value.trim();
      const quantity = parseInt(item.querySelector('input[name="Inventory_Quantity"]').value.trim());
      const expirationDate = item.querySelector('input[name="Expiration_Date"]').value || '';
      const unitLabel = item.querySelector('select[name="Unit_Label"]').value;

      if (!productName || !unitLabel || isNaN(quantity) || quantity <= 0) {
        invalid = true;
        item.scrollIntoView({ behavior: 'smooth' });
        item.style.border = '2px solid red';
        setTimeout(() => item.style.border = '', 3000);
        return;
      }

      const matchedProduct = inventoryProducts.find(p => p.Product_Name_AR === productName);
      const productCode = matchedProduct?.Product_Code || '';
      const category = matchedProduct?.Category || '';
      const packageType = matchedProduct?.Package_Type || '';
      const unitSize = matchedProduct?.Unit_Size || '';

      allInventoryData.push({
        Inventory_ID: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        Timestamp: formatTimestamp(now),
        Entry_User_Name: formData.get('Entry_User_Name'),
        Sales_Rep_Name_AR: formData.get('Sales_Rep_Name_AR'),
        Customer_Name_AR: formData.get('Customer_Name_AR'),
        Customer_Code: customersMain.find(c => c.Customer_Name_AR === formData.get('Customer_Name_AR'))?.Customer_Code || '',
        Product_Name_AR: productName,
        Product_Code: productCode,
        Quantity: quantity,
        Expiration_Date: expirationDate,
        Category: category,
        Package_Type: packageType,
        Unit_Size: unitSize,
        Unit_Label: unitLabel,
        Notes: ''
      });
    });

    if (invalid) {
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    payload = { sheetName: 'Inventory_Logs', data: allInventoryData };

  } else {
    // ✅ إعداد بيانات الزيارة Visit_Logs
    if (!validateProductStatuses()) {
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    const available = [], unavailable = [];
    const items = productsDisplayDiv.querySelectorAll('.product-item');
    items.forEach(div => {
      const name = div.querySelector('label').textContent;
      const selected = div.querySelector('input[type="radio"]:checked');
      if (selected) {
        selected.value === 'متوفر' ? available.push(name) : unavailable.push(name);
      }
    });

    payload = {
      sheetName: 'Visit_Logs',
      data: [{
        Visit_ID: generateVisitID(),
        Customer_Code: customersMain.find(c => c.Customer_Name_AR === formData.get('Customer_Name_AR'))?.Customer_Code || '',
        Customer_Name_AR: formData.get('Customer_Name_AR'),
        Sales_Rep_Name_AR: formData.get('Sales_Rep_Name_AR'),
        Visit_Date: formatDate(now),
        Visit_Time: formatTime(now),
        Visit_Purpose: formData.get('Visit_Purpose'),
        Visit_Outcome: formData.get('Visit_Outcome'),
        Visit_Type_Name_AR: visitType,
        Available_Products_Names: available.join(', '),
        Unavailable_Products_Names: unavailable.join(', '),
        Entry_User_Name: formData.get('Entry_User_Name'),
        Timestamp: formatTimestamp(now),
        Customer_Type: formData.get('Customer_Type'),
        Notes: formData.get('Notes') || ''
      }]
    };
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    showSuccessMessage();
    visitForm.reset();
    productsDisplayDiv.innerHTML = '';
    inventoryItemsContainer.innerHTML = '';
    inventorySection.classList.add('hidden');

  } catch (error) {
    console.error('فشل الإرسال:', error);
    showErrorMessage('حدث خطأ أثناء إرسال البيانات.');
  } finally {
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
  }
}

// ✅ تحميل البيانات وتوصيل الأحداث
document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  visitForm.addEventListener('submit', handleSubmit);
});
