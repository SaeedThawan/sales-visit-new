const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbym4rVEUWd0xkp9JglZNkZp6Hse6IxGSkHgqqKsi05GJhwe2AD95Z1-bGCv7dhWMLBqXQ/exec';

let productsData = [];
let inventoryProductsData = []; // New array for inventory products
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

// New DOM elements for dynamic visibility and inventory section
const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields');
const normalProductSectionDiv = document.getElementById('normalProductSection');
const inventorySectionDiv = document.getElementById('inventorySection');
const inventoryListDatalist = document.getElementById('inventoryList');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');
const customerTypeSelect = document.getElementById('customerType'); // Added to manage 'required' attribute

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
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(date) {
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatTimestamp(date) {
  return date.toLocaleString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
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
    inventoryProductsData, // Load inventory products
    salesRepresentatives,
    customersMain,
    visitOutcomes,
    visitPurposes,
    visitTypes
  ] = await Promise.all([
    fetchJsonData('products.json'),
    fetchJsonData('inventory_products.json'), // Fetch inventory products data
    fetchJsonData('sales_representatives.json'),
    fetchJsonData('customers_main.json'),
    fetchJsonData('visit_outcomes.json'),
    fetchJsonData('visit_purposes.json'),
    fetchJsonData('visit_types.json')
  ]);
  populateSelect(salesRepNameSelect, salesRepresentatives, 'Sales_Rep_Name_AR', 'Sales_Rep_Name_AR');
  populateCustomerDatalist();
  populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
  populateSelect(visitPurposeSelect, visitPurposes);
  populateSelect(visitOutcomeSelect, visitOutcomes);
  setupProductCategories();
  populateInventoryDatalist(); // Populate inventory datalist
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

// Function to populate the inventory product datalist
function populateInventoryDatalist() {
  inventoryListDatalist.innerHTML = '';
  inventoryProductsData.forEach(product => {
    const option = document.createElement('option');
    option.value = product.Product_Name_AR;
    option.setAttribute('data-product-code', product.Product_Code);
    option.setAttribute('data-category', product.Category);
    option.setAttribute('data-package-type', product.Package_Type);
    option.setAttribute('data-unit-size', product.Unit_Size);
    option.setAttribute('data-unit-label', product.Unit_Label);
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
    div.querySelector('input').addEventListener('change', e => toggleProductsDisplay(e.target.value, e.target.checked));
  }
}

function toggleProductsDisplay(category, isChecked) {
  const categoryProducts = productCategories[category];
  if (!categoryProducts) return;

  if (isChecked) {
    categoryProducts.forEach(product => {
      const safeName = product.Product_Name_AR.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '');
      const productId = `product-${safeName}-${Math.random().toString(36).substring(2, 6)}`;
      const productDiv = document.createElement('div');
      productDiv.id = productId;
      productDiv.className = 'product-item';
      productDiv.setAttribute('data-category', category);
      productDiv.innerHTML = `
        <label>${product.Product_Name_AR}</label>
        <div class="radio-group">
          <label><input type="radio" name="status-${productId}" value="متوفر" required> متوفر</label>
          <label><input type="radio" name="status-${productId}" value="غير متوفر" required> غير متوفر</label>
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
  const items = productsDisplayDiv.querySelectorAll('.product-item');
  if (items.length === 0 && !normalProductSectionDiv.classList.contains('hidden')) {
    // If product section is visible but no items are added, it's valid if no products were intended to be selected
    return true; 
  }

  let allValid = true;
  items.forEach(div => {
    const radios = div.querySelectorAll('input[type="radio"]');
    const checked = [...radios].some(r => r.checked);
    if (!checked) {
      allValid = false;
      div.style.border = '2px solid red';
      div.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => (div.style.border = ''), 3000);
    }
  });

  if (!allValid) {
    showWarningMessage('يرجى تحديد حالة التوفر لكل المنتجات الظاهرة.');
  }

  return allValid;
}

function validateInventoryItems() {
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
        input.classList.add('border-red-500'); // Highlight invalid fields
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

    const inventoryItems = [];
    inventoryItemsContainer.querySelectorAll('.inventory-item').forEach(itemDiv => {
      const productName = itemDiv.querySelector('[name="Inventory_Product_Name_AR"]').value;
      const selectedOption = inventoryListDatalist.querySelector(`option[value="${productName}"]`);
      
      const productCode = selectedOption ? selectedOption.dataset.productCode : '';
      const category = selectedOption ? selectedOption.dataset.category : '';
      const packageType = selectedOption ? selectedOption.dataset.packageType : '';
      const unitSize = selectedOption ? selectedOption.dataset.unitSize : '';
      const unitLabel = itemDiv.querySelector('[name="Unit_Label"]').value;


      inventoryItems.push({
        Inventory_ID: generateInventoryID(),
        Timestamp: formatTimestamp(now),
        Entry_User_Name: formData.get('Entry_User_Name'),
        Sales_Rep_Name_AR: formData.get('Sales_Rep_Name_AR'),
        Customer_Name_AR: formData.get('Customer_Name_AR'),
        Customer_Code: customersMain.find(c => c.Customer_Name_AR === formData.get('Customer_Name_AR'))?.Customer_Code || '',
        Product_Name_AR: productName,
        Product_Code: productCode,
        Quantity: formData.get('Inventory_Quantity'), // This will only get the value of the first quantity field if multiple
        Expiration_Date: itemDiv.querySelector('[name="Expiration_Date"]').value || '',
        Category: category,
        Package_Type: packageType,
        Unit_Size: unitSize,
        Unit_Label: unitLabel,
        Notes: formData.get('Notes') || ''
      });
    });

    // For multiple inventory items, need to re-think how formData.get('Inventory_Quantity') works.
    // Each inventory-item should have unique names or be processed individually.
    // For now, let's assume one inventory item or modify the loop to get values correctly.
    // Corrected logic for multiple inventory items:
    const collectedInventoryData = [];
    inventoryItemsContainer.querySelectorAll('.inventory-item').forEach(itemDiv => {
      const productName = itemDiv.querySelector('[name="Inventory_Product_Name_AR"]').value;
      const selectedOption = inventoryListDatalist.querySelector(`option[value="${productName}"]`);
      
      // Ensure product details are retrieved correctly from the datalist option
      const productCode = selectedOption ? selectedOption.dataset.productCode : '';
      const category = selectedOption ? selectedOption.dataset.category : '';
      const packageType = selectedOption ? selectedOption.dataset.packageType : '';
      const unitSize = selectedOption ? selectedOption.dataset.unitSize : '';
      
      collectedInventoryData.push({
        Inventory_ID: generateInventoryID(),
        Timestamp: formatTimestamp(now),
        Entry_User_Name: formData.get('Entry_User_Name'),
        Sales_Rep_Name_AR: formData.get('Sales_Rep_Name_AR'),
        Customer_Name_AR: formData.get('Customer_Name_AR'),
        Customer_Code: customersMain.find(c => c.Customer_Name_AR === formData.get('Customer_Name_AR'))?.Customer_Code || '',
        Product_Name_AR: productName,
        Product_Code: productCode,
        Quantity: itemDiv.querySelector('[name="Inventory_Quantity"]').value,
        Expiration_Date: itemDiv.querySelector('[name="Expiration_Date"]').value || '',
        Category: category,
        Package_Type: packageType,
        Unit_Size: unitSize,
        Unit_Label: itemDiv.querySelector('[name="Unit_Label"]').value,
        Notes: formData.get('Notes') || ''
      });
    });

    payload = {
      sheetName: 'Inventory_Logs',
      data: collectedInventoryData
    };

  } else { // Normal visit
    if (!visitForm.checkValidity()) {
      visitForm.reportValidity();
      showWarningMessage('يرجى تعبئة جميع الحقول المطلوبة.');
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }
    if (!validateProductStatuses()) {
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

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
      Entry_User_Name: formData.get('Entry_User_Name'),
      Timestamp: formatTimestamp(now),
      Customer_Type: formData.get('Customer_Type'),
      Notes: formData.get('Notes') || ''
    };

    const available = [], unavailable = [];
    const items = productsDisplayDiv.querySelectorAll('.product-item');
    items.forEach(div => {
      const name = div.querySelector('label').textContent;
      const selected = div.querySelector('input[type="radio"]:checked');
      if (selected) {
        selected.value === 'متوفر' ? available.push(name) : unavailable.push(name);
      }
    });

    dataToSubmit.Available_Products_Names = available.join(', ');
    dataToSubmit.Unavailable_Products_Names = unavailable.join(', ');

    payload = {
      sheetName: 'Visit_Logs',
      data: [dataToSubmit] // Send as an array for consistency with inventory, though it's a single object
    };
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors', // Required for Google Apps Script deployment
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    showSuccessMessage();
    visitForm.reset();
    productsDisplayDiv.innerHTML = '';
    inventoryItemsContainer.innerHTML = ''; // Clear inventory section
    document.querySelectorAll('input[name="productCategory"]:checked').forEach(c => c.checked = false);
    // Re-add initial inventory item template after clearing
    addInitialInventoryItem(); 
    // Ensure the correct sections are shown/hidden after reset
    toggleVisitSections(visitTypeSelect.value); 

  } catch (error) {
    console.error('فشل الإرسال:', error);
    showErrorMessage('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
  } finally {
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
  }
}

// Function to handle dynamic visibility of sections
function toggleVisitSections(selectedType) {
  if (selectedType === 'جرد استثنائي') {
    normalVisitRelatedFieldsDiv.classList.add('hidden');
    normalProductSectionDiv.classList.add('hidden');
    inventorySectionDiv.classList.remove('hidden');

    // Make regular visit fields not required
    customerTypeSelect.removeAttribute('required');
    visitPurposeSelect.removeAttribute('required');
    visitOutcomeSelect.removeAttribute('required');

    // Clear normal product selections
    productsDisplayDiv.innerHTML = '';
    document.querySelectorAll('input[name="productCategory"]:checked').forEach(c => c.checked = false);


  } else {
    normalVisitRelatedFieldsDiv.classList.remove('hidden');
    normalProductSectionDiv.classList.remove('hidden');
    inventorySectionDiv.classList.add('hidden');

    // Make regular visit fields required
    customerTypeSelect.setAttribute('required', 'required');
    visitPurposeSelect.setAttribute('required', 'required');
    visitOutcomeSelect.setAttribute('required', 'required');

    // Clear inventory items
    inventoryItemsContainer.innerHTML = '';
    addInitialInventoryItem(); // Add back the initial empty inventory item

  }
}

// Function to add a new inventory item form block
function addInventoryItem() {
  const template = `
    <div class="inventory-item border border-yellow-200 p-4 rounded-lg bg-white relative">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label>البحث عن المنتج</label>
          <input type="text" name="Inventory_Product_Name_AR" list="inventoryList" placeholder="ابحث..." required />
          <datalist id="inventoryList">
            </datalist>
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
  populateInventoryDatalistForNewItem(inventoryItemsContainer.lastElementChild.querySelector('datalist')); // Re-populate datalist for new item
}

// Function to re-populate datalist for a newly added inventory item, if needed
function populateInventoryDatalistForNewItem(datalistElement) {
  datalistElement.innerHTML = '';
  inventoryProductsData.forEach(product => {
    const option = document.createElement('option');
    option.value = product.Product_Name_AR;
    option.setAttribute('data-product-code', product.Product_Code);
    option.setAttribute('data-category', product.Category);
    option.setAttribute('data-package-type', product.Package_Type);
    option.setAttribute('data-unit-size', product.Unit_Size);
    option.setAttribute('data-unit-label', product.Unit_Label);
    datalistElement.appendChild(option);
  });
}

// Function to add the initial inventory item template when the form loads or resets
function addInitialInventoryItem() {
  const template = `
    <div class="inventory-item border border-yellow-200 p-4 rounded-lg bg-white relative">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label>البحث عن المنتج</label>
          <input type="text" name="Inventory_Product_Name_AR" list="inventoryList" placeholder="ابحث..." required />
          <datalist id="inventoryList">
            </datalist>
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
  populateInventoryDatalistForNewItem(inventoryItemsContainer.lastElementChild.querySelector('datalist'));

  // Add event listener for the remove button of the initial item
  inventoryItemsContainer.lastElementChild.querySelector('.removeInventoryItem').addEventListener('click', (e) => {
    if (inventoryItemsContainer.children.length > 1) { // Prevent removing the last item
      e.target.closest('.inventory-item').remove();
    } else {
      showWarningMessage('يجب أن يحتوي قسم الجرد على منتج واحد على الأقل.');
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  addInitialInventoryItem(); // Add the first inventory item on load

  visitForm.addEventListener('submit', handleSubmit);

  visitTypeSelect.addEventListener('change', (event) => {
    toggleVisitSections(event.target.value);
  });

  addInventoryItemBtn.addEventListener('click', addInventoryItem);

  // Event listener for dynamically added remove buttons
  inventoryItemsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('removeInventoryItem')) {
      if (inventoryItemsContainer.children.length > 1) { // Prevent removing the last item
        event.target.closest('.inventory-item').remove();
      } else {
        showWarningMessage('يجب أن يحتوي قسم الجرد على منتج واحد على الأقل.');
      }
    }
  });

  // Initial toggle based on default selection (if any) or to set default visibility
  toggleVisitSections(visitTypeSelect.value);
});