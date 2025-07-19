const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbym4rVEUWd0xkp9JglZNkZp6Hse6IxGSkHgqqKsi05GJhwe2AD95Z1-bGCv7dhWMLBqXQ/exec';

let productsData = [];
let inventoryProductsData = []; // ✅ سطر جديد لمنتجات الجرد
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

// ✅ SweetAlert بدل showMessageBox
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
    title: '❌ خطأ!',
    text: message,
    icon: 'error',
    confirmButtonText: 'حسناً'
  });
}

// ✅ تحميل البيانات من ملفات JSON
async function fetchData() {
  try {
    const [
      productsResponse,
      inventoryProductsResponse, // ✅ سطر جديد
      salesRepResponse,
      customersResponse,
      visitOutcomesResponse,
      visitPurposesResponse,
      visitTypesResponse
    ] = await Promise.all([
      fetch('products.json'),
      fetch('inventory_products.json'), // ✅ سطر جديد
      fetch('sales_representatives.json'),
      fetch('customers_main.json'),
      fetch('visit_outcomes.json'),
      fetch('visit_purposes.json'),
      fetch('visit_types.json')
    ]);

    productsData = await productsResponse.json();
    inventoryProductsData = await inventoryProductsResponse.json(); // ✅ سطر جديد
    salesRepresentatives = await salesRepResponse.json();
    customersMain = await customersResponse.json();
    visitOutcomes = await visitOutcomesResponse.json();
    visitPurposes = await visitPurposesResponse.json();
    visitTypes = await visitTypesResponse.json();

    populateSalesRepresentatives();
    populateVisitTypes();
    populateVisitPurposes();
    populateVisitOutcomes();
    populateCustomerList();
    // لا تقم باستدعاء populateProducts هنا بعد الآن، سيتم استدعاؤها بناءً على تغيير نوع الزيارة
  } catch (error) {
    console.error('Error fetching data:', error);
    showErrorMessage('حدث خطأ أثناء تحميل البيانات الأساسية. يرجى إعادة تحميل الصفحة.');
  } finally {
    loadingSpinner.style.display = 'none'; // إخفاء السبينر بعد التحميل
    submitBtn.disabled = false; // تفعيل زر الإرسال
  }
}

// ✅ تعبئة قائمة المندوبين
function populateSalesRepresentatives() {
  salesRepNameSelect.innerHTML = '<option value="">اختر المندوب</option>';
  salesRepresentatives.forEach(rep => {
    const option = document.createElement('option');
    option.value = rep;
    option.textContent = rep;
    salesRepNameSelect.appendChild(option);
  });
}

// ✅ تعبئة قائمة أنواع الزيارة
function populateVisitTypes() {
  visitTypeSelect.innerHTML = '<option value="">اختر نوع الزيارة</option>';
  visitTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type.Visit_Type_Name_AR;
    option.textContent = type.Visit_Type_Name_AR;
    visitTypeSelect.appendChild(option);
  });
}

// ✅ تعبئة قائمة أهداف الزيارة
function populateVisitPurposes() {
  visitPurposeSelect.innerHTML = '<option value="">اختر هدف الزيارة</option>';
  visitPurposes.forEach(purpose => {
    const option = document.createElement('option');
    option.value = purpose;
    option.textContent = purpose;
    visitPurposeSelect.appendChild(option);
  });
}

// ✅ تعبئة قائمة نتائج الزيارة
function populateVisitOutcomes() {
  visitOutcomeSelect.innerHTML = '<option value="">اختر نتيجة الزيارة</option>';
  visitOutcomes.forEach(outcome => {
    const option = document.createElement('option');
    option.value = outcome;
    option.textContent = outcome;
    visitOutcomeSelect.appendChild(option);
  });
}

// ✅ تعبئة قائمة العملاء في الداتاليست
function populateCustomerList() {
  customerListDatalist.innerHTML = ''; // مسح القائمة الموجودة
  customersMain.forEach(customer => {
    const option = document.createElement('option');
    option.value = customer.Customer_Name_AR;
    customerListDatalist.appendChild(option);
  });
}

// ✅ تعبئة المنتجات بناءً على نوع الزيارة المختار
function populateProducts() {
  productsDisplayDiv.innerHTML = ''; // مسح المنتجات المعروضة حاليا
  productCategoriesDiv.innerHTML = ''; // مسح الفئات المعروضة حاليا

  const selectedVisitType = visitTypeSelect.value;
  let currentProducts = [];

  // تحديد مصدر المنتجات بناءً على نوع الزيارة
  if (selectedVisitType === "جرد استثنائي") {
    currentProducts = inventoryProductsData; // استخدام بيانات منتجات الجرد
  } else {
    currentProducts = productsData; // استخدام بيانات المنتجات العادية
  }

  if (currentProducts.length === 0) {
    productsDisplayDiv.innerHTML = '<p class="text-gray-500 text-center">لا توجد منتجات لعرضها لهذا النوع من الزيارة.</p>';
    return;
  }

  // جمع الفئات الفريدة من قائمة المنتجات المختارة حاليًا
  const categories = [...new Set(currentProducts.map(p => p.Category))].sort();

  // إنشاء أزرار الفئات
  categories.forEach(category => {
    const radioBtn = document.createElement('input');
    radioBtn.type = 'radio';
    radioBtn.name = 'productCategory';
    radioBtn.id = `category-${category.replace(/\s+/g, '-')}`;
    radioBtn.value = category;
    radioBtn.className = 'hidden peer';

    const label = document.createElement('label');
    label.htmlFor = `category-${category.replace(/\s+/g, '-')}`;
    label.className = 'category-button';
    label.textContent = category;

    productCategoriesDiv.appendChild(radioBtn);
    productCategoriesDiv.appendChild(label);

    radioBtn.addEventListener('change', () => {
      // تمرير قائمة المنتجات الصحيحة للدالة displayProductsByCategory
      displayProductsByCategory(category, currentProducts);
    });
  });

  // عرض المنتجات الافتراضية للفئة الأولى عند التحميل/التغيير
  if (categories.length > 0) {
    const firstCategoryRadio = document.getElementById(`category-${categories[0].replace(/\s+/g, '-')}`);
    if (firstCategoryRadio) {
      firstCategoryRadio.checked = true;
      displayProductsByCategory(categories[0], currentProducts);
    }
  }
}

// ✅ عرض المنتجات حسب الفئة
function displayProductsByCategory(selectedCategory, productsList) { // ✅ أضف productsList هنا
  productsDisplayDiv.innerHTML = '';
  // استخدم productsList بدلاً من productsData
  const filteredProducts = productsList.filter(p => p.Category === selectedCategory); // ✅ تعديل هنا

  filteredProducts.forEach(product => {
    const productDiv = document.createElement('div');
    productDiv.className = 'product-item bg-white p-4 rounded-lg shadow-sm flex items-center justify-between border border-gray-200';
    productDiv.innerHTML = `
      <label class="text-gray-800 font-medium text-right flex-grow">${product.Product_Name_AR}</label>
      <div class="radio-group flex space-x-4 space-x-reverse">
        <label class="inline-flex items-center">
          <input type="radio" name="product_${product.Product_Name_AR.replace(/\s+/g, '_')}" value="متوفر" class="form-radio text-green-600 h-4 w-4" checked>
          <span class="mr-2 text-green-700">متوفر</span>
        </label>
        <label class="inline-flex items-center">
          <input type="radio" name="product_${product.Product_Name_AR.replace(/\s+/g, '_')}" value="غير متوفر" class="form-radio text-red-600 h-4 w-4">
          <span class="mr-2 text-red-700">غير متوفر</span>
        </label>
      </div>
    `;
    productsDisplayDiv.appendChild(productDiv);
  });
}

// ✅ توليد Visit ID فريد
function generateVisitID() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `VISIT-${timestamp}-${random}`;
}

// ✅ تنسيق الوقت والتاريخ
function formatTimestamp(date) {
  const pad = (num) => num < 10 ? '0' + num : num;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// ✅ معالجة إرسال النموذج
visitForm.addEventListener('submit', async (event) => {
  event.preventDefault(); // منع الإرسال الافتراضي

  // إظهار سبينر التحميل وتعطيل الزر
  submitBtn.disabled = true;
  loadingSpinner.style.display = 'inline-block';

  const now = new Date();
  const formData = new FormData(visitForm);

  const dataToSubmit = {
    Visit_ID: generateVisitID(),
    Customer_Name_AR: formData.get('Customer_Name_AR'),
    Sales_Rep_Name_AR: formData.get('Sales_Rep_Name_AR'),
    Visit_Date: now.toLocaleDateString('en-CA'), // YYYY-MM-DD
    Visit_Time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), // HH:MM:SS
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

  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors', // مهم جداً لـ Google Apps Script
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSubmit),
    });

    // لا يمكننا التحقق من response.ok أو response.json() مع 'no-cors'
    // نفترض النجاح ونعرض رسالة نجاح
    showSuccessMessage();
    visitForm.reset();
    productsDisplayDiv.innerHTML = '';
    productCategoriesDiv.innerHTML = ''; // ✅ مسح أزرار الفئات بعد الإرسال
    // إعادة تعبئة المنتجات بعد إعادة تعيين النموذج (يعتمد على نوع الزيارة الافتراضي)
    populateProducts(); // ✅ إعادة تعبئة المنتجات
    
  } catch (error) {
    console.error('فشل الإرسال:', error);
    showErrorMessage('حدث خطأ أثناء إرسال البيانات. حاول مرة أخرى.');
  } finally {
    submitBtn.disabled = false;
    loadingSpinner.style.display = 'none';
  }
});

// ✅ عند تغيير نوع الزيارة، قم بتحديث قائمة المنتجات
visitTypeSelect.addEventListener('change', () => {
  populateProducts();
});


// ✅ استدعاء fetchData عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  // تأكد من تعبئة المنتجات عند التحميل الأولي (بناءً على القيمة الافتراضية لنوع الزيارة)
  populateProducts();
});