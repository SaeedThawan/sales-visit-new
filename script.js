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
const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields'); // يحتوي على زر إضافة زيارة جديدة + حقول الزيارة الأساسية
const normalProductSectionDiv = document.getElementById('normalProductSection'); // قسم عرض فئات ومنتجات الزيارة العادية
const inventorySectionDiv = document.getElementById('inventorySection'); // قسم الجرد الاستثنائي
const inventoryListDatalist = document.getElementById('inventoryList');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');
const customerTypeSelect = document.getElementById('customerType');
const visitEntriesContainer = document.getElementById('visitEntriesContainer'); // الحاوية الخاصة بـ "إضافة زيارة جديدة"
const addVisitEntryBtn = document.getElementById('addVisitEntry'); // زر إضافة زيارة جديدة


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
  populateSelect(salesRepNameSelect, salesRepresentatives); // Assuming salesRepresentatives is array of strings
  populateCustomerDatalist();
  populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
  populateSelect(visitPurposeSelect, visitPurposes); // Assuming visitPurposes is array of strings
  populateSelect(visitOutcomeSelect, visitOutcomes); // Assuming visitOutcomes is array of strings
  setupProductCategories(); // إعداد فئات المنتجات للزيارات العادية
  populateInventoryDatalist(); // تعبئة الـ datalist لمنتجات الجرد

  // تهيئة الأقسام بناءً على نوع الزيارة الافتراضي (أو أول نوع)
  toggleVisitSections(visitTypeSelect.value);
}

// تعبئة عنصر <select> ببيانات معينة
function populateSelect(selectElement, dataArray, valueKey, textKey) {
  // إبقاء الخيار الأول "اختر..." وحذف البقية
  while (selectElement.children.length > 1) selectElement.removeChild(selectElement.lastChild);
  dataArray.forEach(item => {
    const option = document.createElement('option');
    if (typeof item === 'object' && valueKey && textKey) {
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

// تعبئة الـ datalist الوحيد لمنتجات الجرد
function populateInventoryDatalist() {
  inventoryListDatalist.innerHTML = ''; // مسح الخيارات السابقة
  inventoryProductsData.forEach(product => {
    const option = document.createElement('option');
    option.value = product.Product_Name_AR;
    // تخزين جميع تفاصيل المنتج في dataset لسهولة استعادتها
    for (const key in product) {
      if (Object.hasOwnProperty.call(product, key)) {
        // تحويل المفتاح إلى camelCase ليتوافق مع dataset
        const camelCaseKey = key.replace(/_(\w)/g, (match, p1) => p1.toUpperCase());
        option.dataset[camelCaseKey] = product[key];
      }
    }
    inventoryListDatalist.appendChild(option);
  });
}

// ---------------------------------------------------
// وظائف إدارة المنتجات للزيارات العادية
// ---------------------------------------------------
let productCategories = {}; // لتخزين المنتجات حسب الفئة

// إعداد فئات المنتجات ومربعات الاختيار الخاصة بها
function setupProductCategories() {
  productCategoriesDiv.innerHTML = '';
  productsDisplayDiv.innerHTML = ''; // مسح المنتجات المعروضة
  productCategories = {}; // إعادة تعيين الفئات

  productsData.forEach(product => {
    if (!productCategories[product.Category]) {
      productCategories[product.Category] = [];
    }
    productCategories[product.Category].push(product);
  });

  // إنشاء أزرار الفئات
  for (const category in productCategories) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category;
    button.className = 'category-btn bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium';
    button.dataset.category = category;
    button.addEventListener('click', () => displayProductsByCategory(category));
    productCategoriesDiv.appendChild(button);
  }
}

// عرض المنتجات بناءً على الفئة المختارة
function displayProductsByCategory(category) {
  productsDisplayDiv.innerHTML = ''; // مسح المنتجات المعروضة
  const products = productCategories[category];

  if (products && products.length > 0) {
    products.forEach(product => {
      const productItem = document.createElement('div');
      productItem.className = 'product-item bg-white p-4 rounded-lg shadow flex items-center justify-between';
      productItem.innerHTML = `
                <span class="font-medium text-gray-800">${product.Product_Name_AR}</span>
                <div class="product-status-radios flex items-center space-x-4 space-x-reverse">
                    <label class="inline-flex items-center">
                        <input type="radio" class="form-radio text-green-600" name="product-${product.Product_Name_AR}" value="متوفر" data-product-name="${product.Product_Name_AR}" data-product-category="${product.Category}">
                        <span class="ml-2 text-green-700">متوفر</span>
                    </label>
                    <label class="inline-flex items-center">
                        <input type="radio" class="form-radio text-red-600" name="product-${product.Product_Name_AR}" value="غير متوفر" data-product-name="${product.Product_Name_AR}" data-product-category="${product.Category}">
                        <span class="ml-2 text-red-700">غير متوفر</span>
                    </label>
                </div>
            `;
      productsDisplayDiv.appendChild(productItem);
    });
  } else {
    productsDisplayDiv.innerHTML = '<p class="text-center text-gray-500">لا توجد منتجات لهذه الفئة.</p>';
  }
}


// ---------------------------------------------------
// وظائف إدارة الزيارات المتعددة (الزيارات العادية فقط)
// ---------------------------------------------------
let visitEntryCounter = 0; // لتعقب عدد زيارات "إضافة زيارة جديدة"

function addVisitEntry() {
  visitEntryCounter++;
  const visitEntryId = `visit-entry-${visitEntryCounter}`;
  const template = `
        <div id="${visitEntryId}" class="visit-entry bg-blue-50 p-4 rounded-lg border border-blue-300 mb-4 relative">
            <h3 class="text-lg font-bold text-blue-800 mb-3">تفاصيل زيارة #${visitEntryCounter}</h3>
            ${visitEntryCounter > 1 ? '<button type="button" class="removeVisitEntry absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>' : ''}

            <div class="form-group">
                <label for="visitType-${visitEntryId}">نوع الزيارة</label>
                <select id="visitType-${visitEntryId}" name="Visit_Type_Name_AR" class="mt-1" required>
                    <option value="">اختر نوع الزيارة</option>
                </select>
            </div>
            <div class="form-group">
                <label for="visitPurpose-${visitEntryId}">الغرض من الزيارة</label>
                <select id="visitPurpose-${visitEntryId}" name="Visit_Purpose_AR" class="mt-1" required>
                    <option value="">اختر الغرض</option>
                </select>
            </div>
            <div class="form-group">
                <label for="visitOutcome-${visitEntryId}">نتائج الزيارة</label>
                <select id="visitOutcome-${visitEntryId}" name="Visit_Outcome_AR" class="mt-1" required>
                    <option value="">اختر النتيجة</option>
                </select>
            </div>
            <div class="form-group">
                <label for="visitNotes-${visitEntryId}">ملاحظات خاصة بهذه الزيارة</label>
                <textarea id="visitNotes-${visitEntryId}" name="Visit_Notes" rows="2" class="mt-1" placeholder="أدخل الملاحظات الخاصة بهذه الزيارة..."></textarea>
            </div>
        </div>
    `;
  const newVisitEntry = document.createRange().createContextualFragment(template);
  visitEntriesContainer.appendChild(newVisitEntry);

  // تعبئة القوائم المنسدلة للزيارة الجديدة
  populateSelect(document.getElementById(`visitType-${visitEntryId}`), visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
  populateSelect(document.getElementById(`visitPurpose-${visitEntryId}`), visitPurposes);
  populateSelect(document.getElementById(`visitOutcome-${visitEntryId}`), visitOutcomes);
}

// ---------------------------------------------------
// وظائف إدارة الجرد الاستثنائي
// ---------------------------------------------------
let inventoryItemCounter = 0; // لتعقب عدد منتجات الجرد المضافة ديناميكيًا

function addInventoryItem(initial = false) {
  if (!initial) { // لا نزيد العداد إذا كانت إضافة أولية
    inventoryItemCounter++;
  } else {
    inventoryItemCounter = 1; // لضمان البدء من 1 في أول إضافة
  }

  const itemId = `inventory-item-${inventoryItemCounter}`;
  const template = `
        <div id="${itemId}" class="inventory-item bg-orange-50 p-4 rounded-lg border border-orange-300 mb-4 relative">
            <h3 class="text-lg font-bold text-orange-800 mb-3">منتج جرد #${inventoryItemCounter}</h3>
            ${inventoryItemCounter > 1 ? '<button type="button" class="removeInventoryItem absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>' : ''}

            <div class="form-group">
                <label for="inventoryProductName-${itemId}">اسم المنتج</label>
                <input type="text" id="inventoryProductName-${itemId}" name="Inventory_Product_Name" list="inventoryList" class="mt-1 inventory-product-name" required placeholder="ابحث عن المنتج أو أدخل اسمه" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="form-group">
                    <label>التصنيف</label>
                    <input type="text" name="Inventory_Category" class="mt-1 bg-gray-100 cursor-not-allowed" readonly tabindex="-1" />
                </div>
                <div class="form-group">
                    <label>نوع العبوة</label>
                    <input type="text" name="Inventory_Package_Type" class="mt-1 bg-gray-100 cursor-not-allowed" readonly tabindex="-1" />
                </div>
                <div class="form-group">
                    <label>حجم الوحدة</label>
                    <input type="text" name="Inventory_Unit_Size" class="mt-1 bg-gray-100 cursor-not-allowed" readonly tabindex="-1" />
                </div>
                <div class="form-group">
                    <label>الوحدة</label>
                    <select name="Inventory_Unit_Label" class="mt-1" required>
                        <option value="">اختر الوحدة</option>
                        <option value="حبة">حبة</option>
                        <option value="علبة">علبة</option>
                        <option value="شد">شد</option>
                        <option value="باكت">باكت</option>
                        <option value="كرتون">كرتون</option>
                        <option value="كيلو">كيلو</option>
                        <option value="جرام">جرام</option>
                        <option value="لتر">لتر</option>
                        <option value="ملي لتر">ملي لتر</option>
                        </select>
                </div>
            </div>

            <div class="form-group">
                <label for="inventoryQuantity-${itemId}">الكمية</label>
                <input type="number" id="inventoryQuantity-${itemId}" name="Inventory_Quantity" min="1" class="mt-1" required placeholder="أدخل الكمية" />
            </div>
            <div class="form-group">
                <label for="inventoryExpirationDate-${itemId}">تاريخ الانتهاء (اختياري)</label>
                <input type="date" id="inventoryExpirationDate-${itemId}" name="Inventory_Expiration_Date" class="mt-1" />
            </div>
            
            <div class="form-group">
                <label>حالة المنتج</label>
                <div class="flex items-center space-x-4 space-x-reverse mt-2">
                    <label class="inline-flex items-center">
                        <input type="radio" class="form-radio text-green-600" name="productCondition-${itemId}" value="جيد" required>
                        <span class="ml-2 text-green-700">جيد</span>
                    </label>
                    <label class="inline-flex items-center">
                        <input type="radio" class="form-radio text-red-600" name="productCondition-${itemId}" value="تالف" required>
                        <span class="ml-2 text-red-700">تالف</span>
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label for="inventoryNotes-${itemId}">ملاحظات خاصة بمنتج الجرد (اختياري)</label>
                <textarea id="inventoryNotes-${itemId}" name="Inventory_Notes" rows="2" class="mt-1" placeholder="أدخل ملاحظات الجرد هنا..."></textarea>
            </div>
        </div>
    `;
  const newInventoryItem = document.createRange().createContextualFragment(template);
  inventoryItemsContainer.appendChild(newInventoryItem);

  // إضافة معالج حدث لـ input اسم المنتج للبحث وتعبئة البيانات
  const productNameInput = newInventoryItem.querySelector(`#inventoryProductName-${itemId}`);
  productNameInput.addEventListener('input', (event) => {
    const selectedProductName = event.target.value;
    const parentItem = event.target.closest('.inventory-item');
    const selectedProduct = inventoryProductsData.find(p => p.Product_Name_AR === selectedProductName);

    if (selectedProduct) {
      parentItem.querySelector('[name="Inventory_Category"]').value = selectedProduct.Category || '';
      parentItem.querySelector('[name="Inventory_Package_Type"]').value = selectedProduct.Package_Type || '';
      parentItem.querySelector('[name="Inventory_Unit_Size"]').value = selectedProduct.Unit_Size || '';
      // تعيين الوحدة الافتراضية إذا كانت موجودة في بيانات المنتج
      const unitSelect = parentItem.querySelector('[name="Inventory_Unit_Label"]');
      if (selectedProduct.Unit_Label) {
        const optionExists = Array.from(unitSelect.options).some(option => option.value === selectedProduct.Unit_Label);
        if (optionExists) {
          unitSelect.value = selectedProduct.Unit_Label;
        } else {
          // إذا لم تكن الوحدة موجودة، يمكن إضافتها أو ترك الخيار "اختر الوحدة"
          unitSelect.value = ''; // أو يمكن إضافة option جديد
        }
      }
    } else {
      // مسح الحقول إذا لم يتم العثور على المنتج
      parentItem.querySelector('[name="Inventory_Category"]').value = '';
      parentItem.querySelector('[name="Inventory_Package_Type"]').value = '';
      parentItem.querySelector('[name="Inventory_Unit_Size"]').value = '';
      parentItem.querySelector('[name="Inventory_Unit_Label"]').value = ''; // إعادة تعيين الوحدة
    }
  });
}

// ---------------------------------------------------
// تبديل عرض الأقسام بناءً على نوع الزيارة
// ---------------------------------------------------

function toggleVisitSections(selectedVisitType) {
  if (selectedVisitType === 'جرد استثنائي') {
    normalVisitRelatedFieldsDiv.classList.add('hidden'); // يخفي جميع حقول الزيارة العادية وزر إضافة زيارة
    normalProductSectionDiv.classList.add('hidden'); // يخفي قسم المنتجات العادية
    inventorySectionDiv.classList.remove('hidden'); // يظهر قسم الجرد

    // التأكد من وجود عنصر جرد واحد على الأقل وإزالة الزيارات العادية المضافة ديناميكيًا
    if (inventoryItemsContainer.children.length === 0) {
      addInventoryItem(true); // إضافة أول حقل جرد إذا لم يكن موجودًا
    }
    visitEntriesContainer.innerHTML = ''; // مسح جميع إدخالات الزيارة العادية
    addVisitEntry(); // إضافة زيارة أولية لتفاصيل الزيارة بغض النظر عن النوع
    visitEntryCounter = 0; // إعادة تعيين العداد للزيارات العادية
  } else {
    normalVisitRelatedFieldsDiv.classList.remove('hidden'); // يظهر حقول الزيارة العادية
    normalProductSectionDiv.classList.remove('hidden'); // يظهر قسم المنتجات العادية
    inventorySectionDiv.classList.add('hidden'); // يخفي قسم الجرد

    // التأكد من وجود زيارة عادية واحدة على الأقل وإزالة عناصر الجرد المضافة ديناميكيًا
    if (visitEntriesContainer.children.length === 0) {
      addVisitEntry(); // إضافة أول حقل زيارة عادية إذا لم يكن موجودًا
    }
    inventoryItemsContainer.innerHTML = ''; // مسح جميع إدخالات الجرد
    addInventoryItem(true); // إضافة أول منتج جرد عند التبديل
    inventoryItemCounter = 0; // إعادة تعيين العداد لمنتجات الجرد
  }
}

// ---------------------------------------------------
// دالة معالجة الإرسال (Submit Handler)
// ---------------------------------------------------

async function handleSubmit(event) {
  event.preventDefault(); // منع الإرسال الافتراضي للنموذج

  submitBtn.disabled = true;
  loadingSpinner.classList.remove('hidden');

  const now = new Date();
  const currentDate = formatDate(now);
  const currentTime = formatTime(now);
  const currentTimestamp = formatTimestamp(now);

  // جمع البيانات المشتركة
  const entryUserName = document.getElementById('entryUserName').value;
  const salesRepName = salesRepNameSelect.value;
  const customerName = customerNameInput.value;
  const customerCode = customersMain.find(c => c.Customer_Name_AR === customerName)?.Customer_Code || 'غير معروف';
  const customerType = customerTypeSelect.value;
  const generalNotes = document.getElementById('notes').value;

  // معرف فريد للمجموعة لربط الزيارات والجرد بنفس الإرسال
  const visitGroupID = `GROUP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  let payload = {
    method: 'postData', // اسم الدالة في Google Apps Script
    data: [],
    sheetName: ''
  };

  const selectedMainVisitType = visitTypeSelect.value;

  if (selectedMainVisitType === 'جرد استثنائي') {
    // جمع بيانات الجرد
    const inventoryItems = [];
    const itemElements = inventoryItemsContainer.querySelectorAll('.inventory-item');
    itemElements.forEach(itemElement => {
      const productName = itemElement.querySelector('[name="Inventory_Product_Name"]').value;
      const product = inventoryProductsData.find(p => p.Product_Name_AR === productName);

      if (!product) {
        showErrorMessage(`المنتج "${productName}" غير موجود في قائمة منتجات الجرد.`);
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
        return; // توقف الإرسال
      }

      inventoryItems.push({
        Timestamp: currentTimestamp,
        Date: currentDate,
        Time: currentTime,
        Visit_Group_ID: visitGroupID,
        Entry_User_Name: entryUserName,
        Sales_Rep_Name_AR: salesRepName,
        Customer_Name_AR: customerName,
        Customer_Code: customerCode,
        Customer_Type: customerType,
        Visit_Type_Name_AR: selectedMainVisitType, // نوع الزيارة الرئيسي
        Product_Name_AR: productName,
        Product_Code: product.Product_Code,
        Category: itemElement.querySelector('[name="Inventory_Category"]').value,
        Package_Type: itemElement.querySelector('[name="Inventory_Package_Type"]').value,
        Unit_Size: itemElement.querySelector('[name="Inventory_Unit_Size"]').value,
        Quantity: parseInt(itemElement.querySelector('[name="Inventory_Quantity"]').value),
        Unit_Label: itemElement.querySelector('[name="Inventory_Unit_Label"]').value,
        Expiration_Date: itemElement.querySelector('[name="Inventory_Expiration_Date"]').value,
        Product_Condition: itemElement.querySelector('input[name^="productCondition-"]:checked')?.value || '',
        Inventory_Notes: itemElement.querySelector('[name="Inventory_Notes"]').value,
        General_Notes: generalNotes,
      });
    });

    if (inventoryItems.length === 0) {
      showWarningMessage('الرجاء إضافة منتج واحد على الأقل لقسم الجرد.');
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    payload.data = inventoryItems; // لا حاجة للتجميع هنا إذا كان كل عنصر هو صف
    payload.sheetName = 'Inventory_Logs'; // اسم الشيت للجرد
  } else {
    // جمع بيانات الزيارات العادية (قد تكون زيارة واحدة أو عدة زيارات)
    const visitLogs = [];
    const visitEntryElements = visitEntriesContainer.querySelectorAll('.visit-entry');

    // جمع بيانات توفر المنتجات مرة واحدة من القسم الرئيسي
    const availableProducts = [];
    const productRadios = productsDisplayDiv.querySelectorAll('input[type="radio"]:checked');
    productRadios.forEach(radio => {
      availableProducts.push({
        Product_Name_AR: radio.dataset.productName,
        Category: radio.dataset.productCategory,
        Availability_Status: radio.value
      });
    });

    if (availableProducts.length === 0 && (selectedMainVisitType === 'زيارة بيع' || selectedMainVisitType === 'زيارة تحصيل' || selectedMainVisitType === 'زيارة متابعة')) {
      showWarningMessage('الرجاء تحديد حالة توفر المنتجات (متوفر/غير متوفر) للزيارة.');
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }


    visitEntryElements.forEach(entryElement => {
      const visitId = generateVisitID(); // معرف فريد لكل زيارة
      const visitType = entryElement.querySelector('[name="Visit_Type_Name_AR"]').value;
      const visitPurpose = entryElement.querySelector('[name="Visit_Purpose_AR"]').value;
      const visitOutcome = entryElement.querySelector('[name="Visit_Outcome_AR"]').value;
      const visitNotes = entryElement.querySelector('[name="Visit_Notes"]').value;

      // ربط المنتجات المتوفرة/غير المتوفرة بكل زيارة عادية تم إدخالها
      availableProducts.forEach(productStatus => {
        visitLogs.push({
          Timestamp: currentTimestamp,
          Date: currentDate,
          Time: currentTime,
          Visit_Group_ID: visitGroupID,
          Visit_ID: visitId, // معرف خاص بهذه الزيارة داخل المجموعة
          Entry_User_Name: entryUserName,
          Sales_Rep_Name_AR: salesRepName,
          Customer_Name_AR: customerName,
          Customer_Code: customerCode,
          Customer_Type: customerType,
          Visit_Type_Name_AR: visitType,
          Visit_Purpose_AR: visitPurpose,
          Visit_Outcome_AR: visitOutcome,
          Product_Name_AR: productStatus.Product_Name_AR,
          Product_Category: productStatus.Category,
          Product_Availability_Status: productStatus.Availability_Status,
          Visit_Notes: visitNotes,
          General_Notes: generalNotes,
        });
      });

      // إذا لم يكن هناك أي منتجات تم تحديد حالتها، أضف سجل زيارة واحد بدون بيانات منتج
      if (availableProducts.length === 0) {
        visitLogs.push({
          Timestamp: currentTimestamp,
          Date: currentDate,
          Time: currentTime,
          Visit_Group_ID: visitGroupID,
          Visit_ID: visitId,
          Entry_User_Name: entryUserName,
          Sales_Rep_Name_AR: salesRepName,
          Customer_Name_AR: customerName,
          Customer_Code: customerCode,
          Customer_Type: customerType,
          Visit_Type_Name_AR: visitType,
          Visit_Purpose_AR: visitPurpose,
          Visit_Outcome_AR: visitOutcome,
          Product_Name_AR: '', // لا يوجد منتج محدد
          Product_Category: '',
          Product_Availability_Status: '',
          Visit_Notes: visitNotes,
          General_Notes: generalNotes,
        });
      }
    });

    if (visitLogs.length === 0) {
      showWarningMessage('الرجاء إضافة زيارة واحدة على الأقل.');
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    payload.data = visitLogs;
    payload.sheetName = 'Visit_Logs'; // اسم الشيت للزيارات
  }


  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors', // مطلوب لـ Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // بما أن الوضع هو 'no-cors'، لا يمكننا التحقق من response.ok
    // نفترض النجاح وننتظر رسالة خطأ من Apps Script (إذا تم تكوينها)
    showSuccessMessage();
    visitForm.reset(); // إعادة تعيين النموذج

    // إعادة تهيئة النموذج بعد الإرسال
    productsDisplayDiv.innerHTML = ''; // مسح المنتجات المعروضة
    productCategoriesDiv.innerHTML = ''; // مسح فئات المنتجات
    inventoryItemsContainer.innerHTML = ''; // مسح عناصر الجرد
    visitEntriesContainer.innerHTML = ''; // مسح الزيارات المضافة

    // إعادة تعبئة البيانات الأولية وعرض الأقسام الافتراضية
    await loadAllData(); // يعيد تعبئة القوائم ويهيئ الفئات والمنتجات العادية
    addVisitEntry(); // لضمان وجود حقل زيارة واحد على الأقل عند إعادة التعيين
    addInventoryItem(true); // لضمان وجود حقل جرد واحد على الأقل عند إعادة التعيين


  } catch (err) {
    console.error('خطأ أثناء الإرسال:', err);
    showErrorMessage('حدث خطأ أثناء إرسال البيانات: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
  }
}

// ---------------------------------------------------
// الأحداث عند تحميل الصفحة
// ---------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  loadAllData(); // تحميل جميع البيانات الأولية وتعبئة القوائم
  addVisitEntry(); // إضافة أول حقل لزيارة جديدة عند التحميل
  addInventoryItem(true); // إضافة أول حقل لمنتج الجرد عند التحميل

  visitForm.addEventListener('submit', handleSubmit); // ربط دالة الإرسال بحدث submit للنموذج

  // ربط حدث التغيير لنوع الزيارة لتبديل الأقسام
  visitTypeSelect.addEventListener('change', (event) => {
    toggleVisitSections(event.target.value);
  });

  addInventoryItemBtn.addEventListener('click', () => addInventoryItem(false)); // ربط زر إضافة منتج جرد
  addVisitEntryBtn.addEventListener('click', addVisitEntry); // ربط زر إضافة زيارة جديدة

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

  // تفويض الأحداث لأزرار الحذف للزيارات العادية (لأنها تُضاف ديناميكياً)
  visitEntriesContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('removeVisitEntry')) {
      // السماح بالحذف فقط إذا كان هناك أكثر من زيارة واحدة
      if (visitEntriesContainer.children.length > 1) {
        event.target.closest('.visit-entry').remove();
      } else {
        showWarningMessage('يجب أن تحتوي الزيارات العادية على زيارة واحدة على الأقل.');
      }
    }
  });
});
