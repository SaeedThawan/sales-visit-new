// قم بتحديث هذا الرابط إلى رابط نشر تطبيق الويب الخاص بك
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbym4rVEUWd0xkp9JglZNkZp6Hse6IxGSkHgqqKsi05GJhwe2AD95Z1-bGCv7dhWMLBqXQ/exec';

// تعريف المتغيرات لتخزين البيانات المحملة
let productsData = []; // للمنتجات المرتبطة بالزيارة العادية
let inventoryProductsData = []; // لمنتجات الجرد الاستثنائي
let salesRepresentatives = [];
let customersMain = [];
let visitOutcomes = [];
let visitPurposes = [];
let visitTypes = []; // تم إضافة هذا لتخزين أنواع الزيارات من JSON

// الحصول على عناصر DOM الأساسية
const visitForm = document.getElementById('visitForm');
const salesRepNameSelect = document.getElementById('salesRepName');
const customerNameInput = document.getElementById('customerName');
const customerListDatalist = document.getElementById('customerList');
const visitTypeSelect = document.getElementById('visitType');
const visitPurposeSelect = document.getElementById('visitPurpose');
const visitOutcomeSelect = document.getElementById('visitOutcome');
const customerTypeSelect = document.getElementById('customerType'); // تم إضافة هذا لعنصر نوع العميل
const productCategoriesDiv = document.getElementById('productCategories');
const productsDisplayDiv = document.getElementById('productsDisplay');
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const clientVisitHistoryBox = document.getElementById('clientVisitHistoryBox');
const clientVisitHistoryContent = document.getElementById('clientVisitHistoryContent');

// عناصر DOM الخاصة بالأقسام الديناميكية
const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields');
const normalProductSectionDiv = document.getElementById('normalProductSection');
const inventorySectionDiv = document.getElementById('inventorySection');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');

let inventoryItemCounter = 0; // لعد عناصر الجرد وإعطاء IDs فريدة

// --------------------------------------------------
// وظائف جلب البيانات وتهيئتها
// --------------------------------------------------

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    showErrorMessage('حدث خطأ أثناء تحميل البيانات: ' + error.message);
    return null;
  }
}

async function loadAllData() {
  // استخدام Promise.all لتحميل جميع البيانات بالتوازي
  const [
    products,
    inventoryProducts,
    salesReps,
    customers,
    outcomes,
    purposes,
    types // تم تضمين أنواع الزيارات
  ] = await Promise.all([
    fetchData('products.json'),
    fetchData('inventory_products.json'),
    fetchData('sales_representatives.json'),
    fetchData('customers_main.json'),
    fetchData('visit_outcomes.json'),
    fetchData('visit_purposes.json'),
    fetchData('visit_types.json') // جلب أنواع الزيارات
  ]);

  productsData = products || [];
  inventoryProductsData = inventoryProducts || [];
  salesRepresentatives = salesReps || [];
  customersMain = customers || [];
  visitOutcomes = outcomes || [];
  visitPurposes = purposes || [];
  visitTypes = types || []; // تخزين أنواع الزيارات

  populateSalesReps();
  populateVisitTypes(); // سيتم ملؤها من visit_types.json
  populateVisitPurposes();
  populateVisitOutcomes();
  // populateCustomerTypes(); // إذا كان لديك ملف JSON لأنواع العملاء، ستكون هنا
  setupProductCategories(productsData); // استدعاء هذه الدالة بعد تحميل productsData
  populateCustomerDatalist();
}

function populateSalesReps() {
  salesRepNameSelect.innerHTML = '<option value="">اختر المندوب</option>';
  salesRepresentatives.forEach(rep => {
    const option = document.createElement('option');
    option.value = rep;
    option.textContent = rep;
    salesRepNameSelect.appendChild(option);
  });
}

function populateCustomerDatalist() {
  customerListDatalist.innerHTML = '';
  customersMain.forEach(customer => {
    const option = document.createElement('option');
    option.value = customer.Customer_Name_AR;
    option.setAttribute('data-code', customer.Customer_Code);
    customerListDatalist.appendChild(option);
  });
}

function populateVisitTypes() {
  visitTypeSelect.innerHTML = '<option value="">اختر نوع الزيارة</option>';
  visitTypes.forEach(type => { // استخدام visitTypes التي تم تحميلها من JSON
    const option = document.createElement('option');
    option.value = type.Visit_Type_Name_AR;
    option.textContent = type.Visit_Type_Name_AR;
    visitTypeSelect.appendChild(option);
  });
}

function populateVisitPurposes() {
  visitPurposeSelect.innerHTML = '<option value="">اختر الغرض</option>';
  visitPurposes.forEach(purpose => {
    const option = document.createElement('option');
    option.value = purpose;
    option.textContent = purpose;
    visitPurposeSelect.appendChild(option);
  });
}

function populateVisitOutcomes() {
  visitOutcomeSelect.innerHTML = '<option value="">اختر النتيجة</option>';
  visitOutcomes.forEach(outcome => {
    const option = document.createElement('option');
    option.value = outcome;
    option.textContent = outcome;
    visitOutcomeSelect.appendChild(option);
  });
}

/*
// إذا كان لديك ملف JSON لأنواع العملاء، قم بإلغاء التعليق عن هذه الدالة
function populateCustomerTypes() {
  customerTypeSelect.innerHTML = '<option value="">اختر نوع العميل</option>';
  // افترض أن لديك متغير customersTypesData تم تحميله من JSON
  customersTypesData.forEach(type => {
    const option = document.createElement('option');
    option.value = type.TypeName; // أو ما يناسب اسم المفتاح في JSON الخاص بك
    option.textContent = type.TypeName;
    customerTypeSelect.appendChild(option);
  });
}
*/

// --------------------------------------------------
// وظائف منطق النموذج
// --------------------------------------------------

function toggleVisitSections(visitType) {
  if (visitType === 'جرد استثنائي') {
    normalVisitRelatedFieldsDiv.classList.add('hidden');
    normalProductSectionDiv.classList.add('hidden'); // إخفاء قسم المنتجات العادية
    inventorySectionDiv.classList.remove('hidden');
  } else {
    normalVisitRelatedFieldsDiv.classList.remove('hidden');
    normalProductSectionDiv.classList.remove('hidden'); // إظهار قسم المنتجات العادية
    inventorySectionDiv.classList.add('hidden');
  }
}

// تهيئة فئات المنتجات كـ checkboxes
function setupProductCategories(products) {
  const categories = [];
  products.forEach(p => {
    if (!categories.includes(p.Category)) {
      categories.push(p.Category);
    }
  });

  // إنشاء مربعات اختيار لكل فئة
  productCategoriesDiv.innerHTML = categories.map(category => `
    <label class="inline-flex items-center mr-4 mb-2 cursor-pointer category-label">
      <input type="checkbox" name="productCategoryFilter" value="${category}" class="form-checkbox h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer" checked>
      <span class="ml-2 text-gray-700">${category}</span>
    </label>
  `).join('');

  // إضافة event listener لمربعات الاختيار الخاصة بالفئات
  productCategoriesDiv.querySelectorAll('input[name="productCategoryFilter"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      // جمع جميع الفئات المختارة حالياً
      const selectedCategories = Array.from(productCategoriesDiv.querySelectorAll('input[name="productCategoryFilter"]:checked'))
                                    .map(cb => cb.value);
      
      // تحديث عرض المنتجات للزيارة العادية بناءً على الفئات المختارة
      displayProducts(productsData, selectedCategories);
      // تحديث داتاليست منتجات الجرد
      updateInventoryProductDatalists(selectedCategories);
    });
  });

  // عرض المنتجات الأولية (كلها في البداية)
  displayProducts(productsData, categories); // اعرض كل المنتجات افتراضيا عند التحميل
}

// تعديل displayProducts لعرض المنتجات من فئات متعددة
function displayProducts(products, selectedCategories = []) {
  productsDisplayDiv.innerHTML = ''; // مسح المنتجات المعروضة سابقاً

  let productsToDisplay = products;

  if (selectedCategories && selectedCategories.length > 0) {
      productsToDisplay = products.filter(p => selectedCategories.includes(p.Category));
  }
  // إذا كانت selectedCategories فارغة (أي لا توجد فئات محددة)، فسيتم عرض جميع المنتجات تلقائياً لأننا لم نقم بفلترة.

  if (productsToDisplay.length === 0) {
    productsDisplayDiv.innerHTML = '<p class="text-gray-500">لا توجد منتجات لعرضها في الفئات المختارة.</p>';
    return;
  }

  productsToDisplay.forEach(product => {
    const productId = `product-${product.Product_Code}`; // استخدام كود المنتج لـ ID فريد
    const productHtml = `
      <div class="product-item p-3 border border-gray-200 rounded-md bg-white shadow-sm" data-product-code="${product.Product_Code}" data-product-name="${product.Product_Name_AR}" data-category="${product.Category}">
        <h4 class="font-medium text-gray-800">${product.Product_Name_AR}</h4>
        <div class="flex items-center space-x-4 mt-2">
          <label class="inline-flex items-center">
            <input type="radio" name="product_status_${productId}" value="متوفرة" class="form-radio text-green-600" required>
            <span class="ml-2 text-gray-700">متوفرة</span>
          </label>
          <label class="inline-flex items-center">
            <input type="radio" name="product_status_${productId}" value="غير متوفرة" class="form-radio text-red-600">
            <span class="ml-2 text-gray-700">غير متوفرة</span>
          </label>
        </div>
      </div>
    `;
    productsDisplayDiv.insertAdjacentHTML('beforeend', productHtml);
  });
}

// دالة لجمع المنتجات المحددة في قسم الزيارة العادية
function getSelectedProductsForNormalVisit() {
    const selectedProducts = [];
    document.querySelectorAll('.product-item').forEach(productDiv => {
        const productName = productDiv.dataset.productName;
        const productCode = productDiv.dataset.productCode;
        const category = productDiv.dataset.category;
        const productId = `product-${productCode}`; // إعادة بناء الـ ID المستخدم في اسم الراديو
        const availability = productDiv.querySelector(`input[name="product_status_${productId}"]:checked`);

        if (availability) {
            selectedProducts.push({
                Product_Name_AR: productName,
                Product_Code: productCode,
                Category: category,
                Availability_Status: availability.value, // "متوفرة" or "غير متوفرة"
            });
        }
    });
    return selectedProducts;
}


function addInitialInventoryItem() {
  // إزالة العنصر الأولي الفارغ الذي يتم إنشاؤه في HTML لمنع التكرار
  const initialItem = document.querySelector('.inventory-item');
  if (initialItem) {
    initialItem.remove();
  }
  addInventoryItem(); // إضافة أول حقل لمنتج الجرد ديناميكياً
}

function addInventoryItem() {
  inventoryItemCounter++; // زيادة العداد لإعطاء IDs فريدة
  const currentInventoryItemId = `inventory-item-${inventoryItemCounter}`; // ID فريد لكل عنصر جرد
  const currentDatalistId = `inventoryList-${inventoryItemCounter}`; // ID فريد للداتاليست

  const newItemHtml = `
    <div class="inventory-item p-4 border border-gray-200 rounded-md relative bg-white shadow-sm" id="${currentInventoryItemId}">
      <h3 class="font-semibold text-gray-700 mb-3">منتج الجرد #${inventoryItemCounter}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label for="inventoryProductName-${inventoryItemCounter}">اسم المنتج</label>
          <input type="text" id="inventoryProductName-${inventoryItemCounter}" name="Inventory_Product_Name_AR"
                 class="mt-1 product-search-input" list="${currentDatalistId}" placeholder="ابحث..." required />
          <datalist id="${currentDatalistId}"></datalist>
          <div class="product-details text-sm text-gray-600 mt-1">
            </div>
        </div>
        <div class="form-group">
          <label for="inventoryQuantity-${inventoryItemCounter}">الكمية</label>
          <input type="number" id="inventoryQuantity-${inventoryItemCounter}" name="Inventory_Quantity" min="1"
                 placeholder="أدخل الكمية" required class="mt-1 text-lg p-2 w-full" style="height: 48px;" />
        </div>
        <div class="form-group">
          <label for="expirationDate-${inventoryItemCounter}">تاريخ الانتهاء</label>
          <input type="date" id="expirationDate-${inventoryItemCounter}" name="Expiration_Date" class="mt-1" />
        </div>
        <div class="form-group">
          <label for="unitLabel-${inventoryItemCounter}">الوحدة</label>
          <select id="unitLabel-${inventoryItemCounter}" name="Unit_Label" class="mt-1" required>
            <option value="">اختر الوحدة</option>
            <option value="علبة">علبة</option>
            <option value="شد">شد</option>
            <option value="باكت">باكت</option>
            <option value="كرتون">كرتون</option>
            <option value="جرام">جرام</option>
            <option value="ملي">ملي</option>
            <option value="لتر">لتر</option>
          </select>
        </div>
        <div class="form-group">
          <label for="productCondition-${inventoryItemCounter}">حالة المنتج</label>
          <select id="productCondition-${inventoryItemCounter}" name="Product_Condition" class="mt-1" required>
            <option value="">اختر الحالة</option>
            <option value="جيد">جيد</option>
            <option value="تالف">تالف</option>
            <option value="منتهي الصلاحية">منتهي الصلاحية</option>
          </select>
        </div>
      </div>
      <button type="button" class="removeInventoryItem absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>
    </div>
  `;
  inventoryItemsContainer.insertAdjacentHTML('beforeend', newItemHtml);

  // إعداد البحث عن المنتج وعرض التفاصيل للعنصر الجديد
  const newProductInput = document.getElementById(`inventoryProductName-${inventoryItemCounter}`);
  setupInventoryProductSearch(newProductInput, currentDatalistId);

  // تحديث داتاليست العنصر الجديد بناءً على الفئة المحددة حالياً
  const selectedCategoryRadios = productCategoriesDiv.querySelectorAll('input[name="productCategoryFilter"]:checked');
  const selectedCategories = Array.from(selectedCategoryRadios).map(cb => cb.value);
  updateInventoryProductDatalists(selectedCategories);
}

function setupInventoryProductSearch(inputElement, datalistId) {
  inputElement.addEventListener('input', (event) => {
    const inputValue = event.target.value;
    const selectedOption = document.getElementById(datalistId).querySelector(`option[value="${inputValue}"]`);
    const productDetailsDiv = event.target.closest('.form-group').querySelector('.product-details');

    if (selectedOption) {
      const productCode = selectedOption.getAttribute('data-product-code');
      const product = inventoryProductsData.find(p => p.Product_Code === productCode);

      if (product) {
        productDetailsDiv.innerHTML = `
          <p><strong>الفئة:</strong> ${product.Category || '-'}</p>
          <p><strong>نوع العبوة:</strong> ${product.Package_Type || '-'}</p>
          <p><strong>حجم الوحدة:</strong> ${product.Unit_Size || '-'} ${product.Unit_Label || ''}</p>
        `;
      } else {
        productDetailsDiv.innerHTML = 'تفاصيل المنتج غير متوفرة.';
      }
    } else {
      productDetailsDiv.innerHTML = ''; // مسح التفاصيل إذا لم يتم اختيار منتج صحيح
    }
  });
}

// تعديل updateInventoryProductDatalists لتأخذ مصفوفة من الفئات
function updateInventoryProductDatalists(selectedCategories = []) {
  // تحديث جميع داتاليست منتجات الجرد الموجودة في النموذج
  const allInventoryDatalists = inventoryItemsContainer.querySelectorAll('datalist');

  allInventoryDatalists.forEach(datalist => {
    let filteredProducts = inventoryProductsData;

    // إذا تم اختيار فئات، قم بالفلترة
    if (selectedCategories && selectedCategories.length > 0) {
      filteredProducts = inventoryProductsData.filter(product => selectedCategories.includes(product.Category));
    }
    // إذا كانت selectedCategories فارغة، فسيتم عرض جميع المنتجات تلقائياً.

    datalist.innerHTML = filteredProducts.map(product =>
      `<option value="${product.Product_Name_AR}" data-product-code="${product.Product_Code}" data-category="${product.Category}" data-package-type="${product.Package_Type}" data-unit-size="${product.Unit_Size}" data-unit-label="${product.Unit_Label}"></option>`
    ).join('');
  });
}

// --------------------------------------------------
// معالجة إرسال النموذج
// --------------------------------------------------

async function handleSubmit(event) {
  event.preventDefault();
  submitBtn.disabled = true;
  loadingSpinner.classList.remove('hidden');

  const formData = new FormData(visitForm);
  let payloadToSend = {}; // سيحتوي على الـ payload النهائي

  const visitType = formData.get('Visit_Type_Name_AR');
  const customerName = formData.get('Customer_Name_AR');
  const selectedCustomer = customersMain.find(cust => cust.Customer_Name_AR === customerName);
  const customerCode = selectedCustomer ? selectedCustomer.Customer_Code : '';

  if (!customerCode) {
    showErrorMessage('يرجى اختيار عميل من القائمة المقترحة.');
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
    return;
  }

  // Common data for both visit types
  const commonData = {
    Timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }),
    Visit_Group_ID: `GROUP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    Entry_User_Name: formData.get('Entry_User_Name'),
    Sales_Rep_Name_AR: formData.get('Sales_Rep_Name_AR'),
    Customer_Name_AR: customerName,
    Customer_Code: customerCode,
    Visit_Type_Name_AR: visitType,
    Notes: formData.get('Notes'),
  };

  if (visitType === 'جرد استثنائي') {
    const inventoryItems = [];
    let hasError = false; // Flag to check for errors during item collection

    document.querySelectorAll('.inventory-item').forEach(itemDiv => {
      const productNameInput = itemDiv.querySelector('[name="Inventory_Product_Name_AR"]');
      const quantityInput = itemDiv.querySelector('[name="Inventory_Quantity"]');
      const expirationDateInput = itemDiv.querySelector('[name="Expiration_Date"]');
      const unitLabelInput = itemDiv.querySelector('[name="Unit_Label"]');
      const conditionInput = itemDiv.querySelector('[name="Product_Condition"]');

      const productName = productNameInput ? productNameInput.value : '';
      const quantity = quantityInput ? quantityInput.value : '';
      const expirationDate = expirationDateInput ? expirationDateInput.value : '';
      const unitLabel = unitLabelInput ? unitLabelInput.value : '';
      const condition = conditionInput ? conditionInput.value : '';

      if (!productName || !quantity || !unitLabel || !condition) {
        showErrorMessage('يرجى ملء جميع الحقول المطلوبة لمنتجات الجرد (اسم المنتج، الكمية، الوحدة، حالة المنتج).');
        hasError = true;
        return;
      }

      const selectedProduct = inventoryProductsData.find(p => p.Product_Name_AR === productName);

      if (selectedProduct) {
        inventoryItems.push({
          Product_Name_AR: productName,
          Product_Code: selectedProduct.Product_Code,
          Quantity: Number(quantity),
          Expiration_Date: expirationDate,
          Category: selectedProduct.Category,
          Package_Type: selectedProduct.Package_Type,
          Unit_Size: selectedProduct.Unit_Size,
          Unit_Label: unitLabel,
          Product_Condition: condition,
          Original_Quantities: [Number(quantity)] // لتتبع الكميات الأصلية للدمج
        });
      } else {
        showErrorMessage(`المنتج "${productName}" في الجرد غير موجود في قائمة المنتجات المدعومة.`);
        hasError = true;
        return;
      }
    });

    if (hasError) {
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    if (inventoryItems.length === 0) {
      showWarningMessage('يرجى إضافة منتجات للجرد أو تغيير نوع الزيارة.');
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    payloadToSend = {
      type: 'inventory',
      data: consolidateInventoryItems(inventoryItems).map(item => ({
        ...commonData,
        ...item
      })),
      sheetName: 'Inventory_Logs'
    };

  } else { // Normal visit
    const mainVisitData = {
      ...commonData,
      Visit_Purpose_Name_AR: formData.get('Visit_Purpose_Name_AR'),
      Visit_Outcome_Name_AR: formData.get('Visit_Outcome_Name_AR'),
      Customer_Type: formData.get('Customer_Type'), // الآن يتم جلب قيمة نوع العميل من النموذج
      Available_Products_Names: '', // سيتم ملؤها لاحقاً
      Unavailable_Products_Names: '' // سيتم ملؤها لاحقاً
    };

    const selectedProducts = getSelectedProductsForNormalVisit();
    const availableProducts = [];
    const unavailableProducts = [];

    selectedProducts.forEach(product => {
      if (product.Availability_Status === 'متوفرة') {
        availableProducts.push(product.Product_Name_AR);
      } else if (product.Availability_Status === 'غير متوفرة') {
        unavailableProducts.push(product.Product_Name_AR);
      }
    });

    if (selectedProducts.length === 0) {
        showWarningMessage('يرجى تحديد حالة توفر المنتجات المرتبطة بالزيارة.');
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
        return;
    }

    mainVisitData.Available_Products_Names = availableProducts.join(', ') || '';
    mainVisitData.Unavailable_Products_Names = unavailableProducts.join(', ') || '';

    payloadToSend = {
      type: 'visit',
      data: [mainVisitData], // إرسال صف واحد لكل زيارة
      sheetName: 'Visit_Logs'
    };
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
