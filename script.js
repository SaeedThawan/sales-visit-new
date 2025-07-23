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
const addInventoryItemBtn = document.getElementById('addInventoryItem');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');


// ---------------------------------------------------
// وظائف المساعدة العامة
// ---------------------------------------------------

function showLoadingSpinner() {
  submitBtn.disabled = true;
  loadingSpinner.classList.remove('hidden');
}

function hideLoadingSpinner() {
  submitBtn.disabled = false;
  loadingSpinner.classList.add('hidden');
}

function showSuccessMessage(message) {
  Swal.fire({
    icon: 'success',
    title: 'نجاح!',
    text: message,
    confirmButtonText: 'حسناً'
  });
}

function showErrorMessage(message) {
  Swal.fire({
    icon: 'error',
    title: 'خطأ!',
    text: message,
    confirmButtonText: 'حسناً'
  });
}

function showWarningMessage(message) {
  Swal.fire({
    icon: 'warning',
    title: 'تنبيه!',
    text: message,
    confirmButtonText: 'حسناً'
  });
}


// ---------------------------------------------------
// تحميل وتعبئة البيانات
// ---------------------------------------------------

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    showErrorMessage(`فشل في تحميل البيانات من ${url.split('/').pop()}. يرجى المحاولة مرة أخرى.`);
    return [];
  }
}

async function loadAllData() {
  [productsData, inventoryProductsData, salesRepresentatives, customersMain, visitOutcomes, visitPurposes, visitTypes] = await Promise.all([
    fetchData('products.json'),
    fetchData('inventory_products.json'),
    fetchData('sales_representatives.json'),
    fetchData('customers_main.json'),
    fetchData('visit_outcomes.json'),
    fetchData('visit_purposes.json'),
    fetchData('visit_types.json')
  ]);

  populateSalesReps();
  populateCustomers();
  populateVisitOutcomes();
  populateVisitPurposes();
  populateVisitTypes();
  renderProductCategories(); // استدعاء لعرض الفئات
  addInitialInventoryItem(); // إضافة حقل جرد مبدئي
}

function populateSelect(selectElement, data, valueKey = null, textKey = null) {
  selectElement.innerHTML = `<option value="">اختر...</option>`; // إعادة تعيين الخيارات مع خيار افتراضي
  data.forEach(item => {
    const option = document.createElement('option');
    option.value = valueKey ? item[valueKey] : item;
    option.textContent = textKey ? item[textKey] : item;
    selectElement.appendChild(option);
  });
}

function populateSalesReps() {
  populateSelect(salesRepNameSelect, salesRepresentatives);
}

function populateCustomers() {
  customerListDatalist.innerHTML = ''; // مسح القائمة الحالية
  customersMain.forEach(customer => {
    const option = document.createElement('option');
    option.value = customer.Customer_Name_AR;
    customerListDatalist.appendChild(option);
  });
}

function populateVisitOutcomes() {
  populateSelect(visitOutcomeSelect, visitOutcomes);
}

function populateVisitPurposes() {
  populateSelect(visitPurposeSelect, visitPurposes);
}

function populateVisitTypes() {
  populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
}


// ---------------------------------------------------
// إدارة أقسام الزيارة (عادية / جرد استثنائي)
// ---------------------------------------------------

function toggleVisitSections(selectedType) {
  if (selectedType === 'جرد استثنائي') {
    normalVisitRelatedFieldsDiv.classList.add('hidden');
    normalProductSectionDiv.classList.add('hidden');
    inventorySectionDiv.classList.remove('hidden');
    // مسح المنتجات العادية وخانات الاختيار عند التحول للجرد
    productsDisplayDiv.innerHTML = '';
    const checkboxes = productCategoriesDiv.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
  } else {
    normalVisitRelatedFieldsDiv.classList.remove('hidden');
    normalProductSectionDiv.classList.remove('hidden');
    inventorySectionDiv.classList.add('hidden');
    // التأكد من وجود حقل جرد واحد على الأقل عند العودة من الجرد
    if (inventoryItemsContainer.children.length === 0) {
      addInitialInventoryItem();
    }
  }
}


// ---------------------------------------------------
// إدارة منتجات الزيارة العادية
// ---------------------------------------------------

// دالة لجلب الفئات الفريدة من المنتجات
function getUniqueCategories(products) {
  const categories = new Set();
  products.forEach(product => {
    if (product.Category) {
      categories.add(product.Category);
    }
  });
  return Array.from(categories).sort();
}

function renderProductCategories() {
  productCategoriesDiv.innerHTML = '';
  const categories = getUniqueCategories(productsData);

  categories.forEach(category => {
    const div = document.createElement('div');
    div.classList.add('flex', 'items-center', 'mb-2'); // Tailwind classes for flex and margin

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `category-${category.replace(/\s/g, '-')}`;
    checkbox.name = 'productCategory';
    checkbox.value = category;
    checkbox.classList.add('form-checkbox', 'h-5', 'w-5', 'text-indigo-600', 'mr-2'); // Tailwind classes for checkbox styling

    // **مهم: جعل خانات الاختيار غير محددة تلقائيًا**
    checkbox.checked = false; // هذا هو التغيير الأساسي هنا

    // ربط حدث التغيير لفلترة وعرض المنتجات
    checkbox.addEventListener('change', filterAndDisplayProducts);

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = category;
    label.classList.add('text-gray-700'); // Tailwind class for text color

    div.appendChild(checkbox);
    div.appendChild(label);
    productCategoriesDiv.appendChild(div);
  });

  // مسح عرض المنتجات في البداية
  productsDisplayDiv.innerHTML = '';
}

function filterAndDisplayProducts() {
  const selectedCategories = Array.from(
    productCategoriesDiv.querySelectorAll('input[name="productCategory"]:checked')
  ).map(checkbox => checkbox.value);

  productsDisplayDiv.innerHTML = ''; // مسح المنتجات المعروضة حالياً

  if (selectedCategories.length === 0) {
    // إذا لم يتم تحديد أي فئة، لا تعرض أي منتجات
    return;
  }

  // تصفية المنتجات بناءً على الفئات المحددة
  const filteredProducts = productsData.filter(product =>
    selectedCategories.includes(product.Category)
  );

  // عرض المنتجات المفلترة مع خيارات المتوفر/غير متوفر
  filteredProducts.forEach(product => {
    const productItemDiv = document.createElement('div');
    productItemDiv.classList.add('product-item', 'border', 'p-3', 'rounded-lg', 'mb-3', 'shadow-sm', 'relative');
    productItemDiv.innerHTML = `
      <div class="font-bold text-gray-800 mb-2">${product.Product_Name_AR}</div>
      <input type="hidden" name="Product_Name_AR" value="${product.Product_Name_AR}" />
      <input type="hidden" name="Product_Code" value="${product.Product_Code}" />
      <input type="hidden" name="Category" value="${product.Category}" />
      <input type="hidden" name="Package_Type" value="${product.Package_Type || ''}" />
      <input type="hidden" name="Unit_Size" value="${product.Unit_Size || ''}" />
      <input type="hidden" name="Unit_Label" value="${product.Unit_Label || ''}" />
      <div class="flex items-center space-x-4">
        <label class="inline-flex items-center">
          <input type="radio" name="Availability_${product.Product_Code}" value="متوفرة" class="form-radio text-green-600" required>
          <span class="ml-2 text-gray-700">متوفرة</span>
        </label>
        <label class="inline-flex items-center">
          <input type="radio" name="Availability_${product.Product_Code}" value="غير متوفرة" class="form-radio text-red-600" required>
          <span class="ml-2 text-gray-700">غير متوفرة</span>
        </label>
      </div>
    `;
    productsDisplayDiv.appendChild(productItemDiv);
  });
}


// ---------------------------------------------------
// إدارة منتجات الجرد الاستثنائي
// ---------------------------------------------------

function addInitialInventoryItem() {
  if (inventoryItemsContainer.children.length === 0) {
    addInventoryItem();
  }
}

function addInventoryItem() {
  const itemIndex = inventoryItemsContainer.children.length; // استخدام الطول الحالي كمؤشر

  const template = `
    <div class="inventory-item border border-gray-300 p-4 rounded-lg mb-4 bg-white relative shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="form-group">
          <label for="inventoryProductName_${itemIndex}">اسم المنتج</label>
          <input type="text" id="inventoryProductName_${itemIndex}" name="Inventory_Product_Name_AR" list="inventoryProductList_${itemIndex}" placeholder="ابحث أو اختر المنتج..." required />
          <datalist id="inventoryProductList_${itemIndex}"></datalist>
        </div>
        <div class="form-group">
          <label>الكمية</label>
          <input type="number" name="Inventory_Quantity" min="1" placeholder="أدخل الكمية" required />
        </div>
        <div class="form-group">
          <label>تاريخ الانتهاء (اختياري)</label>
          <input type="date" name="Expiration_Date" />
        </div>
        <div class="form-group">
          <label>الوحدة</label>
          <select name="Unit_Label" required>
            <option value="">اختر الوحدة</option>
            <option value="علبة">علبة</option>
            <option value="شد">شد</option>
            <option value="باكت">باكت</option>
            <option value="جرام">جرام</option>
            <option value="كيلو">كيلو</option>
            <option value="مل">مل</option>
            <option value="لتر">لتر</option>
          </select>
        </div>
      </div>
      <button type="button" class="removeInventoryItem absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>
    </div>
  `;
  const newItem = document.createRange().createContextualFragment(template);
  inventoryItemsContainer.appendChild(newItem);

  // تعبئة datalist للمنتج الجديد
  const newProductDatalist = newItem.querySelector(`#inventoryProductList_${itemIndex}`);
  populateInventoryProductDatalist(newProductDatalist);
}

function populateInventoryProductDatalist(datalistElement) {
  datalistElement.innerHTML = '';
  inventoryProductsData.forEach(product => {
    const option = document.createElement('option');
    option.value = product.Product_Name_AR;
    datalistElement.appendChild(option);
  });
}

// ---------------------------------------------------
// إرسال البيانات
// ---------------------------------------------------

async function handleSubmit(event) {
  event.preventDefault();
  showLoadingSpinner();

  const formData = new FormData(visitForm);
  const data = {};

  // جمع البيانات الأساسية للزيارة
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }

  // جمع بيانات المنتجات العادية (إذا كانت الزيارة ليست جرد استثنائي)
  const selectedVisitType = visitTypeSelect.value;
  if (selectedVisitType !== 'جرد استثنائي') {
    const productItems = productsDisplayDiv.querySelectorAll('.product-item');
    data.Products = [];
    productItems.forEach(item => {
      const productName = item.querySelector('input[name="Product_Name_AR"]').value;
      const productCode = item.querySelector('input[name="Product_Code"]').value;
      const category = item.querySelector('input[name="Category"]').value;
      const packageType = item.querySelector('input[name="Package_Type"]').value;
      const unitSize = item.querySelector('input[name="Unit_Size"]').value;
      const unitLabel = item.querySelector('input[name="Unit_Label"]').value;
      const availabilityRadio = item.querySelector(`input[name="Availability_${productCode}"]:checked`);
      
      if (availabilityRadio) {
          data.Products.push({
              Product_Name_AR: productName,
              Product_Code: productCode,
              Category: category,
              Package_Type: packageType,
              Unit_Size: unitSize,
              Unit_Label: unitLabel,
              Availability: availabilityRadio.value // "متوفرة" أو "غير متوفرة"
          });
      }
    });

    if (data.Products.length === 0 && selectedVisitType !== '') {
        showWarningMessage('الرجاء اختيار فئة واحدة على الأقل وتحديد حالة توفر المنتجات.');
        hideLoadingSpinner();
        return;
    }
  } else {
    // جمع بيانات منتجات الجرد الاستثنائي
    const inventoryItems = inventoryItemsContainer.querySelectorAll('.inventory-item');
    data.Inventory_Products = [];
    inventoryItems.forEach(item => {
      const productName = item.querySelector('input[name="Inventory_Product_Name_AR"]').value;
      const quantity = item.querySelector('input[name="Inventory_Quantity"]').value;
      const expiryDate = item.querySelector('input[name="Expiration_Date"]').value;
      const unitLabel = item.querySelector('select[name="Unit_Label"]').value;

      // البحث عن Product_Code و Category من بيانات inventoryProductsData
      const productDetail = inventoryProductsData.find(p => p.Product_Name_AR === productName);
      
      data.Inventory_Products.push({
        Product_Name_AR: productName,
        Product_Code: productDetail ? productDetail.Product_Code : 'N/A', // إضافة الكود
        Category: productDetail ? productDetail.Category : 'N/A', // إضافة الفئة
        Quantity: quantity,
        Expiration_Date: expiryDate,
        Unit_Label: unitLabel
      });
    });

    if (data.Inventory_Products.length === 0 || !data.Inventory_Products[0].Product_Name_AR) {
      showWarningMessage('الرجاء إضافة منتج واحد على الأقل وتعبئة بياناته لقسم الجرد الاستثنائي.');
      hideLoadingSpinner();
      return;
    }
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success') {
        showSuccessMessage('تم إرسال بيانات الزيارة بنجاح!');
        visitForm.reset();
        // إعادة تهيئة الواجهة بعد الإرسال
        toggleVisitSections(visitTypeSelect.value); // إخفاء الأقسام حسب نوع الزيارة المحددة
        productsDisplayDiv.innerHTML = ''; // مسح المنتجات المعروضة
        const checkboxes = productCategoriesDiv.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false); // إلغاء تحديد الفئات
        inventoryItemsContainer.innerHTML = ''; // مسح منتجات الجرد
        addInitialInventoryItem(); // إضافة حقل جرد مبدئي واحد
      } else {
        showErrorMessage(`حدث خطأ أثناء الإرسال: ${result.message || 'خطأ غير معروف'}`);
      }
    } else {
      showErrorMessage(`فشل الإرسال. استجابة الخادم: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    showErrorMessage(`حدث خطأ غير متوقع أثناء الإرسال: ${error.message}`);
  } finally {
    hideLoadingSpinner();
  }
}


// ---------------------------------------------------
// الأحداث عند تحميل الصفحة
// ---------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  loadAllData(); // تحميل جميع البيانات الأولية

  // في البداية، اجعل قسم الجرد مخفيًا والقسم العادي مرئيًا
  // وهذا يضمن أن النموذج يبدأ بالوضع الافتراضي "زيارة بيع" أو أي شيء ليس "جرد استثنائي"
  toggleVisitSections(visitTypeSelect.value); // سيتم تنفيذها بناءً على القيمة الافتراضية للفئة المختارة

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
});
