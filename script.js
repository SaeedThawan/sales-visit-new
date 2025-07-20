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
const inventoryListDatalist = document.getElementById('inventoryList'); // Now this correctly points to the single global datalist
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
  populateInventoryDatalist(); // Populate inventory datalist once for the single datalist element
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

// Function to populate the single inventory product datalist
function populateInventoryDatalist() {
  inventoryListDatalist.innerHTML = ''; // Clear previous options
  inventoryProductsData.forEach(product => {
    const option = document.createElement('option');
    option.value = product.Product_Name_AR;
    // Store all product details in dataset for easy retrieval
    for (const key in product) {
        if (Object.hasOwnProperty.call(product, key)) {
            // Convert to camelCase for dataset keys as per HTML5 spec
            option.dataset[key.replace(/_(\w)/g, (match, p1) => p1.toUpperCase())] = product[key];
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
    // Corrected event listener attachment for clarity and robustness
    div.querySelector('input[type="checkbox"]').addEventListener('change', e => toggleProductsDisplay(e.target.value, e.target.checked));
  }
}

function toggleProductsDisplay(category, isChecked) {
  const categoryProducts = productCategories[category];
  if (!categoryProducts) return;

  if (isChecked) {
    categoryProducts.forEach(product => {
      // Use a more robust way to create a unique ID, avoid special characters in HTML ID
      const uniqueId = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const productDiv = document.createElement('div');
      productDiv.id = uniqueId;
      productDiv.className = 'product-item border border-gray-300 p-3 rounded-lg flex justify-between items-center'; // Added some styling classes
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
  // If the product section is hidden, no validation is needed for it.
  if (normalProductSectionDiv.classList.contains('hidden')) {
    return true; 
  }
  
  const items = productsDisplayDiv.querySelectorAll('.product-item');
  if (items.length === 0) {
    // If product section is visible but no categories selected, it's valid if no products were intended to be selected
    return true; 
  }

  let allValid = true;
  items.forEach(div => {
    const radios = div.querySelectorAll('input[type="radio"]');
    const checked = [...radios].some(r => r.checked);
    if (!checked) {
      allValid = false;
      div.classList.add('border-red-500', 'ring-2', 'ring-red-500'); // Highlight invalid fields
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
  // If the inventory section is hidden, no validation is needed for it.
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

    const collectedInventoryData = [];
    inventoryItemsContainer.querySelectorAll('.inventory-item').forEach(itemDiv => {
      const productName = itemDiv.querySelector('[name="Inventory_Product_Name_AR"]').value;
      const selectedOption = inventoryListDatalist.querySelector(`option[value="${productName}"]`);
      
      let productDetails = {};
      if (selectedOption) {
          // Retrieve all data attributes from the selected option
          for (const key in selectedOption.dataset) {
              // Convert camelCase dataset key back to original snake_case if needed, or keep camelCase if backend handles it
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
        Product_Code: productDetails.productCode || '', // Use retrieved detail
        Category: productDetails.category || '', // Use retrieved detail
        Package_Type: productDetails.packageType || '', // Use retrieved detail
        Unit_Size: productDetails.unitSize || '', // Use retrieved detail
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

  } else { // Normal visit
    // For normal visits, we need to check form validity for the main fields
    // and then product statuses separately.
    if (!visitForm.checkValidity()) {
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

    // Correct payload structure for normal visits
    payload = {
      sheetName: 'Visit_Logs',
      data: [dataToSubmit] 
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

    // Check if the submission was successful (even with no-cors, we can assume success if no network error)
    // For no-cors, response.ok will always be false, so we assume success unless fetch throws an error.
    showSuccessMessage();
    visitForm.reset();
    productsDisplayDiv.innerHTML = '';
    // Uncheck all product category checkboxes
    document.querySelectorAll('#productCategories input[type="checkbox"]').forEach(c => c.checked = false); 
    
    // Clear inventory section and re-add initial item
    inventoryItemsContainer.innerHTML = ''; 
    addInitialInventoryItem(); 
    
    // Ensure the correct sections are shown/hidden after reset based on default selected visit type
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
    document.querySelectorAll('#productCategories input[type="checkbox"]').forEach(c => c.checked = false);


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

// Function to add the initial inventory item template when the form loads or resets
function addInitialInventoryItem() {
  // Check if the container is not empty (meaning it already has the initial item)
  // or if the inventory section is currently hidden (meaning it's not the active view)
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
  addInitialInventoryItem(); // Add the first inventory item on load

  visitForm.addEventListener('submit', handleSubmit);

  visitTypeSelect.addEventListener('change', (event) => {
    toggleVisitSections(event.target.value);
  });

  addInventoryItemBtn.addEventListener('click', addInventoryItem);

  // Event listener for dynamically added remove buttons
  inventoryItemsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('removeInventoryItem')) {
      // Allow removing only if there's more than one inventory item
      if (inventoryItemsContainer.children.length > 1) { 
        event.target.closest('.inventory-item').remove();
      } else {
        showWarningMessage('يجب أن يحتوي قسم الجرد على منتج واحد على الأقل.');
      }
    }
  });

  // Initial toggle based on default selection (if any) or to set default visibility
  // This will also correctly set the 'required' attributes and clear sections
  toggleVisitSections(visitTypeSelect.value); 
});