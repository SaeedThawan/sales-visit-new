const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbym4rVEUWd0xkp9JglZNkZp6Hse6IxGSkHgqqKsi05GJhwe2AD95Z1-bGCv7dhWMLBqXQ/exec';

let productsData = [];
let inventoryProductsData = [];
let salesRepresentatives = [];
let customersMain = [];
let visitOutcomes = [];
let visitPurposes = [];
let visitTypes = [];

const visitForm = document.getElementById('visitForm');
const salesRepNameSelect = document.getElementById('salesRepName');
const customerNameInput = document.getElementById('customerName');
const customerListDatalist = document.getElementById('customerList');
const visitTypeSelect = document.getElementById('visitType');
const visitPurposeSelect = document.getElementById('visitPurpose');
const visitOutcomeSelect = document.getElementById('visitOutcome');
const productCategoriesDiv = document.getElementById('productCategories');
const productsDisplayDiv = document.getElementById('productsDisplay');
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields');
const normalProductSectionDiv = document.getElementById('normalProductSection');
const inventorySectionDiv = document.getElementById('inventorySection');
const inventoryListDatalist = document.getElementById('inventoryList');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');
const customerTypeSelect = document.getElementById('customerType');

function showSuccessMessage() {
  Swal.fire({
    title: '✅ تم الإرسال!',
    text: 'تم إرسال النموذج بنجاح.',
    icon: 'success',
    confirmButtonText: 'ممتاز'
  });
}

function showErrorMessage(message) {
  Swal.fire({
    title: '❌ فشل الإرسال',
    text: message || 'حدث خطأ أثناء إرسال النموذج. حاول مجددًا.',
    icon: 'error',
    confirmButtonText: 'موافق'
  });
}

function showWarningMessage(message) {
  Swal.fire({
    title: '⚠️ تنبيه',
    text: message,
    icon: 'warning',
    confirmButtonText: 'موافق'
  });
}

function generateVisitID() {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `VISIT-${timestamp}-${randomString}`;
}

function generateInventoryID() {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `INV-${timestamp}-${randomString}`;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function formatTimestamp(date) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

async function fetchJsonData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`خطأ في تحميل ${url}:`, error);
    showErrorMessage(`فشل تحميل البيانات من ${url}`);
    return [];
  }
}

async function loadAllData() {
  [
    productsData,
    inventoryProductsData,
    salesRepresentatives,
    customersMain,
    visitOutcomes,
    visitPurposes,
    visitTypes
  ] = await Promise.all([
    fetchJsonData('products.json'),
    fetchJsonData('inventory_products.json'),
    fetchJsonData('sales_representatives.json'),
    fetchJsonData('customers_main.json'),
    fetchJsonData('visit_outcomes.json'),
    fetchJsonData('visit_purposes.json'),
    fetchJsonData('visit_types.json')
  ]);
  
  populateSelect(salesRepNameSelect, salesRepresentatives);
  populateCustomerDatalist();
  populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
  populateSelect(visitPurposeSelect, visitPurposes);
  populateSelect(visitOutcomeSelect, visitOutcomes);
  setupProductCategories();
  populateInventoryDatalist();
}

function populateSelect(selectElement, dataArray, valueKey, textKey) {
  while (selectElement.children.length > 1) selectElement.removeChild(selectElement.lastChild);
  dataArray.forEach(item => {
    const option = document.createElement('option');
    if (typeof item === 'object') {
      option.value = item[valueKey];
      option.textContent = item[textKey];
    } else {
      option.value = item;
      option.textContent = item;
    }
    selectElement.appendChild(option);
  });
}

function populateCustomerDatalist() {
  customerListDatalist.innerHTML = '';
  customersMain.forEach(customer => {
    const option = document.createElement('option');
    option.value = customer.Customer_Name_AR;
    customerListDatalist.appendChild(option);
  });
}

function populateInventoryDatalist() {
  inventoryListDatalist.innerHTML = '';
  inventoryProductsData.forEach(product => {
    const option = document.createElement('option');
    option.value = product.Product_Name_AR;
    for (const key in product) {
        if (Object.hasOwnProperty.call(product, key)) {
            const camelCaseKey = key.replace(/_(\w)/g, (match, p1) => p1.toUpperCase());
            option.dataset[camelCaseKey] = product[key];
        }
    }
    inventoryListDatalist.appendChild(option);
  });
}

let productCategories = {};
function setupProductCategories() {
  productCategoriesDiv.innerHTML = '';
  productCategories = {};
  productsData.forEach(product => {
    if (!productCategories[product.Category]) productCategories[product.Category] = [];
    productCategories[product.Category].push(product);
  });

  for (const category in productCategories) {
    const div = document.createElement('div');
    div.className = 'flex items-center';
    div.innerHTML = `
      <input type="checkbox" id="cat-${category.replace(/\s/g, '-')}" value="${category}" class="h-5 w-5 text-indigo-600 border-gray-300 rounded cursor-pointer">
      <label for="cat-${category.replace(/\s/g, '-')}" class="ml-2 text-sm font-medium text-gray-700">${category}</label>
    `;
    productCategoriesDiv.appendChild(div);
    div.querySelector('input[type="checkbox"]').addEventListener('change', e => toggleProductsDisplay(e.target.value, e.target.checked));
  }
}

function toggleProductsDisplay(category, isChecked) {
  const categoryProducts = productCategories[category];
  if (!categoryProducts) return;

  if (isChecked) {
    categoryProducts.forEach(product => {
      const uniqueId = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const productDiv = document.createElement('div');
      productDiv.id = uniqueId;
      productDiv.className = 'product-item border border-gray-300 p-3 rounded-lg flex justify-between items-center';
      productDiv.setAttribute('data-category', category);
      productDiv.innerHTML = `
        <label class="font-medium text-gray-800">${product.Product_Name_AR}</label>
        <div class="radio-group flex space-x-4 space-x-reverse">
          <label class="inline-flex items-center">
            <input type="radio" name="status-${uniqueId}" value="متوفر" class="form-radio text-green-600" required> 
            <span class="mr-2">متوفر</span>
          </label>
          <label class="inline-flex items-center">
            <input type="radio" name="status-${uniqueId}" value="غير متوفر" class="form-radio text-red-600" required> 
            <span class="mr-2">غير متوفر</span>
          </label>
        </div>
      `;
      productsDisplayDiv.appendChild(productDiv);
    });
  } else {
    const toRemove = productsDisplayDiv.querySelectorAll(`[data-category="${category}"]`);
    toRemove.forEach(div => div.remove());
  }
}

function validateProductStatuses() {
  if (normalProductSectionDiv.classList.contains('hidden')) {
    return true; 
  }
  
  const items = productsDisplayDiv.querySelectorAll('.product-item');
  if (items.length === 0) {
    return true; 
  }

  let allValid = true;
  items.forEach(div => {
    const radios = div.querySelectorAll('input[type="radio"]');
    const checked = [...radios].some(r => r.checked);
    if (!checked) {
      allValid = false;
      div.classList.add('border-red-500', 'ring-2', 'ring-red-500');
      div.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => div.classList.remove('border-red-500', 'ring-2', 'ring-red-500'), 3000);
    }
  });

  if (!allValid) {
    showWarningMessage('يرجى تحديد حالة التوفر لكل المنتجات الظاهرة.');
  }

  return allValid;
}

function validateInventoryItems() {
  if (inventorySectionDiv.classList.contains('hidden')) {
    return true;
  }

  const items = inventoryItemsContainer.querySelectorAll('.inventory-item');
  if (items.length === 0) {
    showWarningMessage('يرجى إضافة منتجات الجرد وتعبئة جميع الحقول المطلوبة.');
    return false;
  }

  let allValid = true;
  items.forEach(itemDiv => {
    const inputs = itemDiv.querySelectorAll('input[required], select[required]');
    inputs.forEach(input => {
      if (!input.value) {
        allValid = false;
        input.classList.add('border-red-500');
        setTimeout(() => input.classList.remove('border-red-500'), 3000);
      }
    });
  });

  if (!allValid) {
    showWarningMessage('يرجى تعبئة جميع الحقول المطلوبة في قسم الجرد.');
  }

  return allValid;
}

async function handleSubmit(event) {
  event.preventDefault();
  submitBtn.disabled = true;
  loadingSpinner.classList.remove('hidden');

  const formData = new FormData(visitForm);
  const now = new Date();
  const selectedVisitType = visitTypeSelect.value;
  let payload = {};

  if (selectedVisitType === 'جرد استثنائي') {
    if (!validateInventoryItems()) {
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    const collectedInventoryData = [];
    inventoryItemsContainer.querySelectorAll('.inventory-item').forEach(itemDiv => {
      const productName = itemDiv.querySelector('[name="Inventory_Product_Name_AR"]').value;
      const selectedOption = inventoryListDatalist.querySelector(`option[value="${productName}"]`);
      
      let productDetails = {};
      if (selectedOption) {
          for (const key in selectedOption.dataset) {
              productDetails[key] = selectedOption.dataset[key];
          }
      }

      collectedInventoryData.push({
        Inventory_ID: generateInventoryID(),
        Timestamp: formatTimestamp(now),
        Entry_User_Name: formData.get('Entry_User_Name'),
        Sales_Rep_Name_AR: formData.get('Sales_Rep_Name_AR'),
        Customer_Name_AR: formData.get('Customer_Name_AR'),
        Customer_Code: customersMain.find(c => c.Customer_Name_AR === formData.get('Customer_Name_AR'))?.Customer_Code || '',
        Product_Name_AR: productName,
        Product_Code: productDetails.productCode || '',
        Category: productDetails.category || '',
        Package_Type: productDetails.packageType || '',
        Unit_Size: productDetails.unitSize || '',
        Quantity: itemDiv.querySelector('[name="Inventory_Quantity"]').value,
        Expiration_Date: itemDiv.querySelector('[name="Expiration_Date"]').value || '',
        Unit_Label: itemDiv.querySelector('[name="Unit_Label"]').value,
        Notes: formData.get('Notes') || ''
      });
    });

    payload = {
      sheetName: 'Inventory_Logs',
      data: collectedInventoryData
    };

  } else {
    const requiredFields = ['Customer_Name_AR', 'Sales_Rep_Name_AR', 'Visit_Purpose', 'Visit_Outcome'];
    const missingFields = requiredFields.filter(field => !formData.get(field));
    if (missingFields.length > 0) {
      showWarningMessage(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

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

    const dataToSubmit = {
      Visit_ID: generateVisitID(),
      Customer_Name_AR: formData.get('Customer_Name_AR'),
      Customer_Code: customersMain.find(c => c.Customer_Name_AR === formData.get('Customer_Name_AR'))?.Customer_Code || '',
      Sales_Rep_Name_AR: formData.get('Sales_Rep_Name_AR'),
      Visit_Date: formatDate(now),
      Visit_Time: formatTime(now),
      Visit_Purpose: formData.get('Visit_Purpose'),
      Visit_Outcome: formData.get('Visit_Outcome'),
      Visit_Type_Name_AR: formData.get('Visit_Type_Name_AR'),
      Available_Products_Names: available.join(', ') || 'لا يوجد',
      Unavailable_Products_Names: unavailable.join(', ') || 'لا يوجد',
      Entry_User_Name: formData.get('Entry_User_Name'),
      Timestamp: formatTimestamp(now),
      Customer_Type: formData.get('Customer_Type'),
      Notes: formData.get('Notes') || ''
    };

    payload = {
      sheetName: 'Visit_Logs',
      data: [dataToSubmit]
    };
  }

  console.log("بيانات الإرسال:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    showSuccessMessage();
    visitForm.reset();
    productsDisplayDiv.innerHTML = '';
    document.querySelectorAll('#productCategories input[type="checkbox"]').forEach(c => c.checked = false);
    inventoryItemsContainer.innerHTML = '';
    addInitialInventoryItem();
    toggleVisitSections(visitTypeSelect.value);

  } catch (error) {
    console.error('فشل الإرسال:', error);
    showErrorMessage('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
  } finally {
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
  }
}

function toggleVisitSections(selectedType) {
  if (selectedType === 'جرد استثنائي') {
    normalVisitRelatedFieldsDiv.classList.add('hidden');
    normalProductSectionDiv.classList.add('hidden');
    inventorySectionDiv.classList.remove('hidden');
    customerTypeSelect.removeAttribute('required');
    visitPurposeSelect.removeAttribute('required');
    visitOutcomeSelect.removeAttribute('required');
    productsDisplayDiv.innerHTML = '';
    document.querySelectorAll('#productCategories input[type="checkbox"]').forEach(c => c.checked = false);
  } else {
    normalVisitRelatedFieldsDiv.classList.remove('hidden');
    normalProductSectionDiv.classList.remove('hidden');
    inventorySectionDiv.classList.add('hidden');
    customerTypeSelect.setAttribute('required', 'required');
    visitPurposeSelect.setAttribute('required', 'required');
    visitOutcomeSelect.setAttribute('required', 'required');
    inventoryItemsContainer.innerHTML = '';
    addInitialInventoryItem();
  }
}

function addInventoryItem() {
  const template = `
    <div class="inventory-item border border-yellow-200 p-4 rounded-lg bg-white relative">
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
    </div>
  `;
  const newInventoryItem = document.createRange().createContextualFragment(template);
  inventoryItemsContainer.appendChild(newInventoryItem);
}

function addInitialInventoryItem() {
  if (inventoryItemsContainer.children.length === 0) { 
    const template = `
      <div class="inventory-item border border-yellow-200 p-4 rounded-lg bg-white relative">
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
      </div>
    `;
    const initialItem = document.createRange().createContextualFragment(template);
    inventoryItemsContainer.appendChild(initialItem);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  addInitialInventoryItem();

  visitForm.addEventListener('submit', handleSubmit);

  visitTypeSelect.addEventListener('change', (event) => {
    toggleVisitSections(event.target.value);
  });

  addInventoryItemBtn.addEventListener('click', addInventoryItem);

  inventoryItemsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('removeInventoryItem')) {
      if (inventoryItemsContainer.children.length > 1) { 
        event.target.closest('.inventory-item').remove();
      } else {
        showWarningMessage('يجب أن يحتوي قسم الجرد على منتج واحد على الأقل.');
      }
    }
  });

  toggleVisitSections(visitTypeSelect.value);
});