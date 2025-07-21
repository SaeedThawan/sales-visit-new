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
const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields');
const normalProductSectionDiv = document.getElementById('normalProductSection');
const inventorySectionDiv = document.getElementById('inventorySection');
const inventoryListDatalist = document.getElementById('inventoryList'); 
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');
const customerTypeSelect = document.getElementById('customerType'); 

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

let productCategories = {};
// إعداد فئات المنتجات ومربعات الاختيار الخاصة بها
function setupProductCategories() {
  productCategoriesDiv.innerHTML = '';
  productCategories = {}; // إعادة تعيين الفئات
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
    // ربط حدث التغيير لإظهار/إخفاء المنتجات
    div.querySelector('input[type="checkbox"]').addEventListener('change', e => toggleProductsDisplay(e.target.value, e.target.checked));
  }
}

// إظهار أو إخفاء المنتجات بناءً على اختيار الفئة
function toggleProductsDisplay(category, isChecked) {
  const categoryProducts = productCategories[category];
  if (!categoryProducts) return;

  if (isChecked) {
    categoryProducts.forEach(product => {
      const uniqueId = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`; // معرف فريد لكل منتج
      const productDiv = document.createElement('div');
      productDiv.id = uniqueId;
      productDiv.className = 'product-item border border-gray-300 p-3 rounded-lg flex justify-between items-center';
      productDiv.setAttribute('data-category', category); // لتسهيل إزالتها لاحقاً
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
    // إزالة جميع المنتجات التي تنتمي للفئة الملغاة
    const toRemove = productsDisplayDiv.querySelectorAll(`[data-category="${category}"]`);
    toRemove.forEach(div => div.remove());
  }
}

// ---------------------------------------------------
// وظائف التحقق من الصحة (Validation)
// ---------------------------------------------------

// التحقق من تحديد حالة توفر المنتجات في الزيارات العادية
function validateProductStatuses() {
  // إذا كان قسم المنتجات مخفيًا، فلا داعي للتحقق
  if (normalProductSectionDiv.classList.contains('hidden')) {
    return true; 
  }
  
  const items = productsDisplayDiv.querySelectorAll('.product-item');
  if (items.length === 0) {
    // إذا لم يتم اختيار أي فئات منتجات، يعتبر صحيحاً إذا لم يكن هناك منتجات لعرضها
    return true; 
  }

  let allValid = true;
  items.forEach(div => {
    const radios = div.querySelectorAll('input[type="radio"]');
    const checked = [...radios].some(r => r.checked); // هل تم تحديد أي خيار راديو
    if (!checked) {
      allValid = false;
      div.classList.add('border-red-500', 'ring-2', 'ring-red-500'); // تمييز الحقل غير الصالح
      div.scrollIntoView({ behavior: 'smooth', block: 'center' }); // التمرير إلى الحقل
      setTimeout(() => div.classList.remove('border-red-500', 'ring-2', 'ring-red-500'), 3000); // إزالة التمييز بعد 3 ثوانٍ
    }
  });

  if (!allValid) {
    showWarningMessage('يرجى تحديد حالة التوفر لكل المنتجات الظاهرة.');
  }

  return allValid;
}

// **تم إزالة دالة validateInventoryItems() لأنها لم تعد مطلوبة**

// ---------------------------------------------------
// وظيفة معالجة إرسال النموذج (handleSubmit)
// ---------------------------------------------------

async function handleSubmit(event) {
  event.preventDefault(); // منع الإرسال الافتراضي للنموذج
  submitBtn.disabled = true; // تعطيل زر الإرسال
  loadingSpinner.classList.remove('hidden'); // إظهار مؤشر التحميل

  const formData = new FormData(visitForm);
  const now = new Date();
  const selectedVisitType = visitTypeSelect.value;
  let payload = {}; // المتغير الذي سيحمل البيانات النهائية للإرسال

  // التحقق من الحقول الإجبارية العامة للنموذج
  // هذه التحققات تنطبق على الجميع قبل الدخول في منطق نوع الزيارة
  if (!salesRepNameSelect.value || !customerNameInput.value || !visitTypeSelect.value) {
      showWarningMessage('الرجاء تعبئة حقول "مندوب المبيعات", "اسم العميل", و "نوع الزيارة".');
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
  }
  if (selectedVisitType !== 'جرد استثنائي' && (!visitPurposeSelect.value || !visitOutcomeSelect.value || !customerTypeSelect.value)) {
       showWarningMessage('الرجاء تعبئة حقول "الغرض من الزيارة", "نتيجة الزيارة", و "نوع العميل" للزيارات العادية.');
       submitBtn.disabled = false;
       loadingSpinner.classList.add('hidden');
       return;
  }


  if (selectedVisitType === 'جرد استثنائي') {
    // **لم نعد نتحقق من حقول الجرد هنا، لأنها ليست إلزامية**

    const collectedInventoryData = [];
    inventoryItemsContainer.querySelectorAll('.inventory-item').forEach(itemDiv => {
      const productNameInput = itemDiv.querySelector('[name="Inventory_Product_Name_AR"]');
      const quantityInput = itemDiv.querySelector('[name="Inventory_Quantity"]');
      const unitLabelSelect = itemDiv.querySelector('[name="Unit_Label"]');
      const expirationDateInput = itemDiv.querySelector('[name="Expiration_Date"]');

      // **نجمع البيانات حتى لو كانت فارغة، ولن نجعلها إلزامية**
      const productName = productNameInput ? productNameInput.value : '';
      const quantity = quantityInput ? quantityInput.value : '';
      const unitLabel = unitLabelSelect ? unitLabelSelect.value : '';
      const expirationDate = expirationDateInput ? expirationDateInput.value : '';

      // إذا كانت جميع الحقول الأساسية لمنتج الجرد فارغة، نتجاهل هذا العنصر (اختياري)
      // يمكنك تعديل هذا الشرط إذا كنت تريد إرسال صفوف فارغة تمامًا
      if (!productName && !quantity && !unitLabel && !expirationDate) {
          return; // تخطي هذا العنصر لأنه فارغ تمامًا
      }

      const selectedOption = inventoryListDatalist.querySelector(`option[value="${productName}"]`);
      
      let productDetails = {};
      if (selectedOption) {
          // استعادة جميع تفاصيل المنتج من dataset الخاص بـ option
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
        // البحث عن Customer_Code من بيانات العملاء الرئيسية
        Customer_Code: customersMain.find(c => c.Customer_Name_AR === formData.get('Customer_Name_AR'))?.Customer_Code || '',
        Product_Name_AR: productName,
        Product_Code: productDetails.productCode || '',
        Category: productDetails.category || '',
        Package_Type: productDetails.packageType || '',
        Unit_Size: productDetails.unitSize || '',
        Quantity: quantity, // الكمية قد تكون فارغة الآن
        Expiration_Date: expirationDate, // تاريخ الانتهاء قد يكون فارغا الآن
        Unit_Label: unitLabel, // الوحدة قد تكون فارغة الآن
        Notes: formData.get('Notes') || ''
      });
    });

    // إذا لم يتم جمع أي بيانات جرد بعد الفلترة (أي كل العناصر فارغة)، يمكن إيقاف الإرسال أو السماح به
    if (collectedInventoryData.length === 0) {
        showWarningMessage('لم يتم إدخال أي منتجات جرد صالحة للإرسال. يرجى ملء حقل واحد على الأقل في كل صف جرد أو إضافة صفوف جديدة.');
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
        return;
    }

    // بناء الـ payload لبيانات الجرد
    payload = {
      sheetName: 'Inventory_Logs',
      data: collectedInventoryData
    };

  } else { // زيارة عادية (غير جرد استثنائي)
    // التحقق من صحة حقول النموذج الرئيسية
    // تم نقل التحقق من الحقول الرئيسية العامة إلى أعلى الدالة
    // إذا كان نوع الزيارة عادية، فهذه الحقول (Purpose, Outcome, CustomerType) مطلوبة
    if (!visitForm.checkValidity()) { // هذا التحقق سيشمل الحقول المطلوبة التي بقيت
        showWarningMessage('يرجى تعبئة جميع الحقول المطلوبة للزيارة العادية.');
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
        return;
    }

    // التحقق من حالة توفر المنتجات
    if (!validateProductStatuses()) {
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    // جمع بيانات الزيارة العادية
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

    // جمع المنتجات المتوفرة وغير المتوفرة
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

    // بناء الـ payload لبيانات الزيارات العادية
    payload = {
      sheetName: 'Visit_Logs',
      data: [dataToSubmit] // البيانات يجب أن تكون ضمن مصفوفة
    };
  }

  try {
    // إرسال البيانات إلى Google Apps Script
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors', // مطلوب للتواصل مع Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // إذا لم يكن هناك خطأ في الشبكة، نفترض أن الإرسال ناجح بسبب 'no-cors'
    showSuccessMessage();
    visitForm.reset(); // إعادة تعيين النموذج
    
    // مسح المنتجات المختارة للزيارات العادية
    productsDisplayDiv.innerHTML = '';
    document.querySelectorAll('#productCategories input[type="checkbox"]').forEach(c => c.checked = false); 
    
    // مسح عناصر الجرد وإعادة إضافة العنصر الأولي فقط
    inventoryItemsContainer.innerHTML = ''; 
    addInitialInventoryItem(); 
    
    // إعادة ضبط الأقسام المرئية بناءً على نوع الزيارة الافتراضي بعد إعادة التعيين
    toggleVisitSections(visitTypeSelect.value); 

  } catch (error) {
    console.error('فشل الإرسال:', error);
    showErrorMessage('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
  } finally {
    submitBtn.disabled = false; // تفعيل زر الإرسال
    loadingSpinner.classList.add('hidden'); // إخفاء مؤشر التحميل
  }
}

// ---------------------------------------------------
// وظائف إدارة الأقسام المرئية (Dynamic Sections)
// ---------------------------------------------------

// تبديل ظهور الأقسام بناءً على نوع الزيارة المحدد
function toggleVisitSections(selectedType) {
  if (selectedType === 'جرد استثنائي') {
    normalVisitRelatedFieldsDiv.classList.add('hidden');
    normalProductSectionDiv.classList.add('hidden');
    inventorySectionDiv.classList.remove('hidden');

    // إزالة خاصية 'required' من حقول الزيارة العادية
    customerTypeSelect.removeAttribute('required');
    visitPurposeSelect.removeAttribute('required');
    visitOutcomeSelect.removeAttribute('required');


  } else {
    normalVisitRelatedFieldsDiv.classList.remove('hidden');
    normalProductSectionDiv.classList.remove('hidden');
    inventorySectionDiv.classList.add('hidden');

    // إضافة خاصية 'required' لحقول الزيارة العادية
    customerTypeSelect.setAttribute('required', 'required');
    visitPurposeSelect.setAttribute('required', 'required');
    visitOutcomeSelect.setAttribute('required', 'required');

    // مسح عناصر الجرد وإعادة إضافة العنصر الأولي (في حال كان هناك عناصر أخرى)
    inventoryItemsContainer.innerHTML = '';
    addInitialInventoryItem(); 
  }
}

// ---------------------------------------------------
// وظائف إدارة عناصر الجرد
// ---------------------------------------------------

// إضافة قالب جديد لعنصر الجرد
function addInventoryItem() {
  const template = `
    <div class="inventory-item border border-yellow-200 p-4 rounded-lg bg-white relative">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label>البحث عن المنتج</label>
          <input type="text" name="Inventory_Product_Name_AR" list="inventoryList" placeholder="ابحث..." />
        </div>
        <div class="form-group">
          <label>الكمية</label>
          <input type="number" name="Inventory_Quantity" min="0" placeholder="أدخل الكمية" />
        </div>
        <div class="form-group">
          <label>تاريخ الانتهاء</label>
          <input type="date" name="Expiration_Date" />
        </div>
        <div class="form-group">
          <label>الوحدة</label>
          <select name="Unit_Label">
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

// إضافة عنصر الجرد الأولي عند تحميل الصفحة أو إعادة التعيين
function addInitialInventoryItem() {
  // Always ensure at least one inventory item is present when this function is called
  // First, clear existing items to ensure proper state after reset
  inventoryItemsContainer.innerHTML = ''; 

  const template = `
    <div class="inventory-item border border-yellow-200 p-4 rounded-lg bg-white relative">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label>البحث عن المنتج</label>
          <input type="text" name="Inventory_Product_Name_AR" list="inventoryList" placeholder="ابحث..." />
        </div>
        <div class="form-group">
          <label>الكمية</label>
          <input type="number" name="Inventory_Quantity" min="0" placeholder="أدخل الكمية" />
        </div>
        <div class="form-group">
          <label>تاريخ الانتهاء</label>
          <input type="date" name="Expiration_Date" />
        </div>
        <div class="form-group">
          <label>الوحدة</label>
          <select name="Unit_Label">
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

  // استدعاء دالة تبديل الأقسام عند تحميل الصفحة لأول مرة 
  // لضمان ظهور القسم الصحيح بناءً على القيمة الافتراضية
  toggleVisitSections(visitTypeSelect.value); 
});