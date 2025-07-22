const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbym4rVEUWd0xkp9JglZNkZp6Hse6IxGSkHgqqKsi05GJhwe2AD95Z1-bGCv7dhWMLBqXQ/exec'; // تأكد أن هذا الرابط هو الصحيح لتطبيق الويب الخاص بك

// تعريف المتغيرات لتخزين البيانات المحملة
let productsData = [];
let inventoryProductsData = []; // بيانات منتجات الجرد
let salesRepresentatives = [];
let customersMain = [];
let visitOutcomes = [];
let visitPurposes = [];
let visitTypes = [];

// الحصول على عناصر DOM الأساسية
const visitForm = document.getElementById('visitForm');
const entryUserNameInput = document.getElementById('entryUserName'); // جديد: اسم الموظف المدخل
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

// عناصر DOM الخاصة بالأقسام الديناميكية
const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields');
const normalProductSectionDiv = document.getElementById('normalProductSection');
const inventorySectionDiv = document.getElementById('inventorySection');
const inventoryListDatalist = document.getElementById('inventoryList');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');
const customerTypeSelect = document.getElementById('customerType');
const clientVisitHistoryBox = document.getElementById('clientVisitHistoryBox');
const visitEntriesContainer = document.getElementById('visitEntriesContainer');

let visitCounter = 0; // لتعقب عدد الزيارات المضافة ديناميكيًا

// ---------------------------------------------------
// وظائف المساعدة (Helper Functions)
// ---------------------------------------------------

// عرض رسالة نجاح باستخدام SweetAlert2
function showSuccessMessage() {
  Swal.fire({
    title: '✅ تم الإرسال!',
    text: 'تم إرسال النموذج بنجاح.',
    icon: 'success',
    confirmButtonText: 'ممتاز'
  });
}

// عرض رسالة خطأ باستخدام SweetAlert2
function showErrorMessage(message) {
  Swal.fire({
    title: '❌ فشل الإرسال',
    text: message || 'حدث خطأ أثناء إرسال النموذج. حاول مجددًا.',
    icon: 'error',
    confirmButtonText: 'موافق'
  });
}

// عرض رسالة تحذير باستخدام SweetAlert2
function showWarningMessage(message) {
  Swal.fire({
    title: '⚠️ تنبيه',
    text: message,
    icon: 'warning',
    confirmButtonText: 'موافق'
  });
}

// توليد معرف فريد للزيارة
function generateVisitID() {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `VISIT-${timestamp}-${randomString}`;
}

// توليد معرف فريد لمنتج الجرد
function generateInventoryID() {
  const timestamp = new Date().getTime();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `INV-${timestamp}-${randomString}`;
}

// تنسيق التاريخ
function formatDate(date) {
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

// تنسيق الوقت
function formatTime(date) {
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// تنسيق الطابع الزمني (تاريخ ووقت)
function formatTimestamp(date) {
  return date.toLocaleString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ---------------------------------------------------
// وظائف تحميل وتعبئة البيانات الأولية
// ---------------------------------------------------

// جلب بيانات JSON من مسار معين
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

// تحميل جميع البيانات المطلوبة عند بدء تشغيل الصفحة
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

  // تعبئة القوائم المنسدلة والـ datalists
  populateSelect(salesRepNameSelect, salesRepresentatives, 'Sales_Rep_Name_AR', 'Sales_Rep_Name_AR');
  populateCustomerDatalist();
  populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
  populateSelect(visitPurposeSelect, visitPurposes);
  populateSelect(visitOutcomeSelect, visitOutcomes);
  setupProductCategories(); // إعداد فئات المنتجات للزيارات العادية
  populateInventoryDatalist(); // تعبئة الـ datalist لمنتجات الجرد
}

// تعبئة عنصر <select> ببيانات معينة
function populateSelect(selectElement, dataArray, valueKey, textKey) {
  // إبقاء الخيار الأول "اختر..." وحذف البقية
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

// تعبئة الـ datalist الخاص بالعملاء
function populateCustomerDatalist() {
  customerListDatalist.innerHTML = '';
  customersMain.forEach(customer => {
    const option = document.createElement('option');
    option.value = customer.Customer_Name_AR;
    customerListDatalist.appendChild(option);
  });
}

// تعبئة الـ datalist لمنتجات الجرد
function populateInventoryDatalist() {
  inventoryListDatalist.innerHTML = '';
  inventoryProductsData.forEach(product => {
    const option = document.createElement('option');
    option.value = product.Product_Name_AR;
    // يمكن إضافة بيانات إضافية في dataset إذا احتجت للوصول إليها لاحقًا
    option.dataset.productCode = product.Product_Code;
    option.dataset.category = product.Category;
    option.dataset.packageType = product.Package_Type;
    option.dataset.unitSize = product.Unit_Size;
    option.dataset.unitLabel = product.Unit_Label;
    inventoryListDatalist.appendChild(option);
  });
}

// ---------------------------------------------------
// وظائف التعامل مع أقسام النموذج الديناميكية
// ---------------------------------------------------

// تبديل عرض الأقسام بناءً على نوع الزيارة
function toggleVisitSections(visitType) {
  if (visitType === 'جرد استثنائي') {
    normalVisitRelatedFieldsDiv.classList.add('hidden');
    normalProductSectionDiv.classList.add('hidden');
    inventorySectionDiv.classList.remove('hidden');
  } else {
    normalVisitRelatedFieldsDiv.classList.remove('hidden');
    normalProductSectionDiv.classList.remove('hidden');
    inventorySectionDiv.classList.add('hidden');
  }
}

// إعداد فئات المنتجات للزيارة العادية
function setupProductCategories() {
  productCategoriesDiv.innerHTML = '';
  const categories = [...new Set(productsData.map(p => p.Category))];
  categories.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'category-btn bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium';
    button.textContent = category;
    button.dataset.category = category;
    button.addEventListener('click', () => filterProductsByCategory(category));
    productCategoriesDiv.appendChild(button);
  });
  // عرض جميع المنتجات افتراضيًا
  displayProducts(productsData);
}

// تصفية وعرض المنتجات حسب الفئة
function filterProductsByCategory(category) {
  const filteredProducts = productsData.filter(p => p.Category === category);
  displayProducts(filteredProducts);
  // تحديث حالة الأزرار
  document.querySelectorAll('.category-btn').forEach(btn => {
    if (btn.dataset.category === category) {
      btn.classList.add('bg-indigo-600', 'text-white');
      btn.classList.remove('bg-gray-200', 'text-gray-700');
    } else {
      btn.classList.remove('bg-indigo-600', 'text-white');
      btn.classList.add('bg-gray-200', 'text-gray-700');
    }
  });
}

// عرض المنتجات في قسم الزيارة العادية
function displayProducts(products) {
  productsDisplayDiv.innerHTML = '';
  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card bg-white p-4 rounded-lg shadow-md flex flex-col justify-between';
    productCard.innerHTML = `
      <h3 class="font-semibold text-gray-800">${product.Product_Name_AR}</h3>
      <p class="text-sm text-gray-600 mb-2">الفئة: ${product.Category}</p>
      <div class="flex items-center space-x-2 space-x-reverse mt-auto">
        <label for="quantity-${product.Product_Name_AR}" class="text-gray-700 text-sm">الكمية:</label>
        <input type="number" id="quantity-${product.Product_Name_AR}" min="0" value="0"
          data-product-name="${product.Product_Name_AR}"
          data-product-category="${product.Category}"
          class="product-quantity w-20 p-1 border border-gray-300 rounded-md text-center" />
      </div>
    `;
    productsDisplayDiv.appendChild(productCard);
  });
}

// إضافة حقل جديد لمنتج الجرد
function addInventoryItem() {
  const inventoryItemCount = inventoryItemsContainer.children.length;
  const template = `
    <div class="inventory-item p-4 border border-gray-200 rounded-lg relative">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label>اسم المنتج</label>
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
            <option value="كرتون">كرتون</option>
            <option value="قطعة">قطعة</option>
            <option value="كيلو">كيلو</option>
            <option value="جرام">جرام</option>
            <option value="لتر">لتر</option>
            <option value="ملي لتر">ملي لتر</option>
          </select>
        </div>
        <div class="form-group">
          <label>حالة المنتج</label>
          <select name="Product_Condition" class="mt-1" required>
            <option value="">اختر الحالة</option>
            <option value="سليم">سليم</option>
            <option value="تالف">تالف</option>
            <option value="مرتجع">مرتجع</option>
            <option value="منتهي الصلاحية">منتهي الصلاحية</option>
          </select>
        </div>
      </div>
      ${inventoryItemCount > 0 ? `<button type="button" class="removeInventoryItem absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>` : ''}
    </div>
  `;
  const initialItem = document.createRange().createContextualFragment(template);
  inventoryItemsContainer.appendChild(initialItem);
}

// إضافة أول حقل لمنتج الجرد عند تحميل الصفحة
function addInitialInventoryItem() {
  if (inventoryItemsContainer.children.length === 0) {
    addInventoryItem();
  }
}

// ---------------------------------------------------
// وظائف التعامل مع سجل زيارات العميل
// ---------------------------------------------------

// جلب سجل زيارات العميل من Google Sheet
async function fetchCustomerVisitHistory(customerCode) {
  if (!customerCode) {
    clearVisitHistory();
    return;
  }

  const payload = {
    method: 'getVisitHistory',
    customerCode: customerCode
  };

  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'cors', // Use 'cors' for fetching data
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    displayCustomerVisitHistory(data.history); // assuming the history is in data.history
  } catch (err) {
    console.error('خطأ أثناء جلب سجل الزيارات:', err);
    showErrorMessage('حدث خطأ أثناء جلب سجل زيارات العميل.');
    clearVisitHistory();
  }
}

// عرض سجل زيارات العميل
function displayCustomerVisitHistory(historyData) {
  visitEntriesContainer.innerHTML = ''; // Clear previous entries
  if (!historyData || historyData.length === 0) {
    visitEntriesContainer.innerHTML = '<p class="text-gray-500">لا توجد زيارات سابقة لهذا العميل.</p>';
    clientVisitHistoryBox.classList.remove('hidden');
    return;
  }

  // Display only the last 3 entries if more than 3
  const historyToDisplay = historyData.slice(0, 3);

  historyToDisplay.forEach(entry => {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'border-b border-blue-200 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0';
    entryDiv.innerHTML = `
      <p><strong>تاريخ الزيارة:</strong> ${entry.Visit_Date} - ${entry.Visit_Time}</p>
      <p><strong>نوع الزيارة:</strong> ${entry.Visit_Type_Name_AR}</p>
      <p><strong>الغرض:</strong> ${entry.Visit_Purpose_AR || 'غير محدد'}</p>
      <p><strong>النتيجة:</strong> ${entry.Visit_Outcome_AR || 'غير محدد'}</p>
      ${entry.Notes ? `<p><strong>ملاحظات:</strong> ${entry.Notes}</p>` : ''}
    `;
    visitEntriesContainer.appendChild(entryDiv);
  });
  clientVisitHistoryBox.classList.remove('hidden');
}

// مسح سجل الزيارات المعروض
function clearVisitHistory() {
  visitEntriesContainer.innerHTML = '';
  clientVisitHistoryBox.classList.add('hidden');
}

// ---------------------------------------------------
// وظائف معالجة النموذج والإرسال
// ---------------------------------------------------

// التعامل مع إرسال النموذج
async function handleSubmit(event) {
  event.preventDefault();
  submitBtn.disabled = true;
  loadingSpinner.classList.remove('hidden');

  const formData = new FormData(visitForm);
  const payload = {
    method: 'doPost',
    sheetName: '',
    data: {}
  };

  const visitType = formData.get('Visit_Type_Name_AR');
  const customerName = formData.get('Customer_Name_AR');
  const customerCode = customersMain.find(c => c.Customer_Name_AR === customerName)?.Customer_Code || 'N/A';
  const entryUserName = formData.get('Entry_User_Name');
  const salesRepName = formData.get('Sales_Rep_Name_AR');
  const customerType = formData.get('Customer_Type');
  const notesValue = formData.get('Notes');

  const currentTimestamp = new Date();
  const visitID = generateVisitID();

  // Common data for both visit types
  const commonVisitData = {
    Visit_ID: visitID,
    Timestamp: formatTimestamp(currentTimestamp),
    Entry_User_Name: entryUserName,
    Sales_Rep_Name_AR: salesRepName,
    Customer_Name_AR: customerName,
    Customer_Code: customerCode,
    Customer_Type: customerType,
    Visit_Type_Name_AR: visitType,
    Visit_Date: formatDate(currentTimestamp),
    Visit_Time: formatTime(currentTimestamp),
    Notes: notesValue
  };

  if (visitType === 'جرد استثنائي') {
    // Collect inventory items
    const inventoryItems = [];
    inventoryItemsContainer.querySelectorAll('.inventory-item').forEach(itemDiv => {
      const productName = itemDiv.querySelector('[name="Inventory_Product_Name_AR"]').value;
      const quantity = itemDiv.querySelector('[name="Inventory_Quantity"]').value;
      const expiration = itemDiv.querySelector('[name="Expiration_Date"]').value;
      const unit = itemDiv.querySelector('[name="Unit_Label"]').value;
      const condition = itemDiv.querySelector('[name="Product_Condition"]').value; // New: Product Condition

      const product = inventoryProductsData.find(p => p.Product_Name_AR === productName);

      if (product && quantity && unit && condition) { // Ensure all required fields are present
        inventoryItems.push({
          Inventory_ID: generateInventoryID(),
          Visit_ID: visitID,
          Entry_User_Name: entryUserName,
          Sales_Rep_Name_AR: salesRepName,
          Customer_Name_AR: customerName,
          Customer_Code: customerCode,
          Product_Name_AR: productName,
          Product_Code: product.Product_Code,
          Quantity: Number(quantity),
          Expiration_Date: expiration,
          Category: product.Category,
          Package_Type: product.Package_Type,
          Unit_Size: product.Unit_Size,
          Unit_Label: unit,
          Product_Condition: condition, // New: Product Condition
          Notes: notesValue,
          Merge_Note: '' // Will be filled during consolidation
        });
      }
    });

    if (inventoryItems.length === 0) {
      showErrorMessage('الرجاء إضافة منتجات الجرد وتعبئة الحقول المطلوبة.');
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    const consolidated = consolidateInventoryItems(inventoryItems);
    payload.data = consolidated;
    payload.sheetName = 'Inventory_Logs'; // New sheet for inventory
  } else {
    // Handle normal visit
    const visitPurpose = formData.get('Visit_Purpose_AR');
    const visitOutcome = formData.get('Visit_Outcome_AR');

    // Collect product quantities for normal visits
    const productsVisited = [];
    productsDisplayDiv.querySelectorAll('.product-quantity').forEach(input => {
      const quantity = Number(input.value);
      if (quantity > 0) {
        productsVisited.push({
          Product_Name_AR: input.dataset.productName,
          Category: input.dataset.productCategory,
          Quantity_Visited: quantity
        });
      }
    });

    if (productsVisited.length === 0) {
      showErrorMessage('الرجاء تحديد كمية لمنتج واحد على الأقل في قسم المنتجات.');
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    payload.data = {
      ...commonVisitData,
      Visit_Purpose_AR: visitPurpose,
      Visit_Outcome_AR: visitOutcome,
      Products_Visited: productsVisited // Array of products and quantities
    };
    payload.sheetName = 'Visit_Logs'; // Existing sheet for visit logs
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors', // Use 'no-cors' for submitting data
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // In 'no-cors' mode, response.ok will always be false for cross-origin.
    // We rely on the script to handle success/failure via other means (e.g., visual feedback in the Google Sheet).
    // For direct feedback, you might need a different setup or a proxy.

    showSuccessMessage();
    visitForm.reset();
    clearVisitHistory(); // Clear history on form reset
    productsDisplayDiv.innerHTML = ''; // Clear products display
    inventoryItemsContainer.innerHTML = ''; // Clear inventory items
    addInitialInventoryItem(); // Add back the first inventory item field
    setupProductCategories(); // Re-setup product categories for fresh state
    // Reset toggle to default normal visit view
    toggleVisitSections(visitTypeSelect.value); // Set to current selected value to correctly hide/show sections
    // Clear visit entries container in case it had products listed from last submission
    document.getElementById('visitEntriesContainer').innerHTML = '';


  } catch (err) {
    console.error('خطأ أثناء الإرسال:', err);
    showErrorMessage('حدث خطأ أثناء إرسال البيانات: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
  }
}

// دالة لتجميع المنتجات المكررة في الجرد
function consolidateInventoryItems(items) {
  const consolidated = {};
  items.forEach(item => {
    // Include Product_Condition in the key for consolidation
    const key = `${item.Product_Code}-${item.Expiration_Date}-${item.Unit_Label}-${item.Product_Condition}`;
    if (consolidated[key]) {
      consolidated[key].Quantity += Number(item.Quantity);
    } else {
      consolidated[key] = { ...item };
    }
  });
  return Object.values(consolidated);
}

// ---------------------------------------------------
// الأحداث عند تحميل الصفحة
// ---------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  loadAllData(); // تحميل جميع البيانات الأولية
  addInitialInventoryItem(); // إضافة أول حقل لمنتج الجرد

  visitForm.addEventListener('submit', handleSubmit); // ربط دالة الإرسال بحدث submit للنموذج

  // ربط حدث التغيير لنوع الزيارة لتبديل الأقسام
  visitTypeSelect.addEventListener('change', (event) => {
    toggleVisitSections(event.target.value);
  });

  addInventoryItemBtn.addEventListener('click', addInventoryItem); // ربط زر إضافة منتج جرد

  // تفويض الأحداث لأزرار الحذف لمنتجات الجرد (لأنها تُضاف ديناميكياً)
  inventoryItemsContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('removeInventoryItem')) {
      // السماح بالحذف فقط إذا كان هناك أكثر من عنصر جرد واحد
      if (inventoryItemsContainer.children.length > 1) {
        event.target.closest('.inventory-item').remove();
      } else {
        showWarningMessage('يجب أن يحتوي قسم الجرد على منتج واحد على الأقل.');
      }
    }
  });

  // حدث عند اختيار عميل من الـ datalist لعرض سجل الزيارات
  customerNameInput.addEventListener('input', (event) => {
    const selectedCustomerName = event.target.value;
    const selectedCustomer = customersMain.find(
      (customer) => customer.Customer_Name_AR === selectedCustomerName
    );

    if (selectedCustomer) {
      fetchCustomerVisitHistory(selectedCustomer.Customer_Code);
    } else {
      clearVisitHistory();
    }
  });
});
