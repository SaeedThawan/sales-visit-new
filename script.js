const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbym4rVEUWd0xkp9JglZNkZp6Hse6IxGSkHgqqKsi05GJhwe2AD95Z1-bGCv7dhWMLBqXQ/exec'; // تأكد أن هذا الرابط هو الصحيح لتطبيق الويب الخاص بك

// تعريف المتغيرات لتخزين البيانات المحملة
let productsData = []; // منتجات الزيارات العادية (مع فئات)
let inventoryProductsData = []; // منتجات الجرد الاستثنائي
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
const customerTypeSelect = document.getElementById('customerType');
const generalNotes = document.getElementById('notes'); // ملاحظات عامة
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

// عناصر DOM الخاصة بالأقسام المتغيرة
const normalVisitFieldsDiv = document.getElementById('normalVisitFields'); // يحتوي على الغرض والنتائج
const normalProductSectionDiv = document.getElementById('normalProductSection'); // قسم عرض فئات ومنتجات الزيارة العادية
const productCategoriesDiv = document.getElementById('productCategories');
const productsDisplayDiv = document.getElementById('productsDisplay'); // المنتجات التي تم اختيارها (متوفر/غير متوفر)

const inventorySectionDiv = document.getElementById('inventorySection'); // قسم الجرد الاستثنائي
const inventoryListDatalist = document.getElementById('inventoryList');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');

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

// توليد معرف فريد للمجموعة
function generateGroupID() {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `GROUP-${timestamp}-${randomString}`;
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
    populateSelect(salesRepNameSelect, salesRepresentatives);
    populateCustomerDatalist();
    populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');

    // لزيارات "الغرض والنتيجة" (تتم إضافتها ديناميكيًا الآن)
    // لا يتم تعبئة هذه العناصر مباشرة هنا لأنها ديناميكية
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
// وظائف إدارة المنتجات للزيارات العادية (القسم الثابت)
// ---------------------------------------------------

// تخزين المنتجات المحددة حالتها
let selectedProductsStatus = {}; // { "Product Name": { category: "Category", status: "متوفر/غير متوفر" }, ... }

function setupProductCategories() {
    productCategoriesDiv.innerHTML = '';
    const categories = [...new Set(productsData.map(p => p.Category))]; // استخراج الفئات الفريدة

    // إضافة زر "عرض الكل"
    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.textContent = 'عرض الكل';
    allButton.className = 'category-btn bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium ml-2';
    allButton.addEventListener('click', () => displayProductsByCategories(productsData));
    productCategoriesDiv.appendChild(allButton);

    categories.forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = category;
        button.className = 'category-btn bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium ml-2';
        button.dataset.category = category;
        button.addEventListener('click', () => displayProductsByCategories(productsData.filter(p => p.Category === category)));
        productCategoriesDiv.appendChild(button);
    });

    // عرض جميع المنتجات افتراضيا عند تحميل فئات المنتجات لأول مرة
    displayProductsByCategories(productsData);
}

// عرض المنتجات بناءً على الفئة (أو جميع الفئات)
function displayProductsByCategories(productsToDisplay) {
    productsDisplayDiv.innerHTML = ''; // مسح المنتجات المعروضة
    // فرز المنتجات أبجديا قبل العرض
    productsToDisplay.sort((a, b) => a.Product_Name_AR.localeCompare(b.Product_Name_AR, 'ar'));

    if (productsToDisplay && productsToDisplay.length > 0) {
        productsToDisplay.forEach(product => {
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

            // استعادة الحالة المختارة إذا كانت موجودة
            if (selectedProductsStatus[product.Product_Name_AR]) {
                const status = selectedProductsStatus[product.Product_Name_AR].status;
                const radio = productItem.querySelector(`input[value="${status}"]`);
                if (radio) {
                    radio.checked = true;
                }
            }
        });
    } else {
        productsDisplayDiv.innerHTML = '<p class="text-center text-gray-500">لا توجد منتجات لعرضها في هذه الفئة.</p>';
    }
}

// تحديث selectedProductsStatus عند تغيير حالة منتج
productsDisplayDiv.addEventListener('change', (event) => {
    if (event.target.type === 'radio' && event.target.name.startsWith('product-')) {
        const productName = event.target.dataset.productName;
        const productCategory = event.target.dataset.productCategory;
        const status = event.target.value;
        selectedProductsStatus[productName] = { category: productCategory, status: status };
    }
});


// ---------------------------------------------------
// وظائف إدارة الجرد الاستثنائي
// ---------------------------------------------------
let inventoryItemCounter = 0; // لتعقب عدد منتجات الجرد المضافة ديناميكيًا

function addInventoryItem(initial = false) {
    if (!initial) {
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
            const unitSelect = parentItem.querySelector('[name="Inventory_Unit_Label"]');
            if (selectedProduct.Unit_Label) {
                const optionExists = Array.from(unitSelect.options).some(option => option.value === selectedProduct.Unit_Label);
                if (optionExists) {
                    unitSelect.value = selectedProduct.Unit_Label;
                } else {
                    unitSelect.value = '';
                }
            }
        } else {
            // مسح الحقول إذا لم يتم العثور على المنتج
            parentItem.querySelector('[name="Inventory_Category"]').value = '';
            parentItem.querySelector('[name="Inventory_Package_Type"]').value = '';
            parentItem.querySelector('[name="Inventory_Unit_Size"]').value = '';
            parentItem.querySelector('[name="Inventory_Unit_Label"]').value = '';
        }
    });
}

// ---------------------------------------------------
// تبديل عرض الأقسام بناءً على نوع الزيارة (المتطلب الجديد)
// ---------------------------------------------------

function toggleVisitSections(selectedVisitType) {
    if (selectedVisitType === 'جرد استثنائي') {
        normalVisitFieldsDiv.classList.add('hidden'); // يخفي حقول الغرض والنتائج
        normalProductSectionDiv.classList.add('hidden'); // يخفي قسم المنتجات العادية بالكامل

        inventorySectionDiv.classList.remove('hidden'); // يظهر قسم الجرد
        // التأكد من وجود عنصر جرد واحد على الأقل
        if (inventoryItemsContainer.children.length === 0) {
            addInventoryItem(true);
        }
    } else {
        // أي نوع زيارة آخر (بيع، تحصيل، متابعة، أخرى)
        normalVisitFieldsDiv.classList.remove('hidden'); // يظهر حقول الغرض والنتائج
        normalProductSectionDiv.classList.remove('hidden'); // يظهر قسم المنتجات العادية بالكامل

        inventorySectionDiv.classList.add('hidden'); // يخفي قسم الجرد
        inventoryItemsContainer.innerHTML = ''; // مسح جميع إدخالات الجرد
        inventoryItemCounter = 0; // إعادة تعيين العداد لمنتجات الجرد

        // يجب أن ننشئ حقول الغرض والنتيجة هنا
        setupNormalVisitFields();
        setupProductCategories(); // يعيد عرض فئات المنتجات وكل المنتجات
    }
    // مسح المنتجات المحددة حالتها عند التبديل بين نوعي الزيارة الرئيسيين
    selectedProductsStatus = {};
}


// وظيفة لإنشاء وتعبئة حقول الغرض والنتيجة (الآن يتم استدعاؤها ديناميكياً)
function setupNormalVisitFields() {
    normalVisitFieldsDiv.innerHTML = `
        <div class="form-group">
            <label for="visitPurpose">الغرض من الزيارة</label>
            <select id="visitPurpose" name="Visit_Purpose_AR" class="mt-1" required>
                <option value="">اختر الغرض</option>
            </select>
        </div>
        <div class="form-group">
            <label for="visitOutcome">نتائج الزيارة</label>
            <select id="visitOutcome" name="Visit_Outcome_AR" class="mt-1" required>
                <option value="">اختر النتيجة</option>
            </select>
        </div>
    `;
    populateSelect(document.getElementById('visitPurpose'), visitPurposes);
    populateSelect(document.getElementById('visitOutcome'), visitOutcomes);
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
    const generalNotesValue = generalNotes.value; // استخدام متغير جديد لتجنب الالتباس مع notes في payloads

    // معرف فريد للمجموعة لربط الزيارات والجرد بنفس الإرسال
    const visitGroupID = generateGroupID();

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

        if (itemElements.length === 0) {
            showWarningMessage('الرجاء إضافة منتج واحد على الأقل لقسم الجرد.');
            submitBtn.disabled = false;
            loadingSpinner.classList.add('hidden');
            return;
        }

        itemElements.forEach(itemElement => {
            const productName = itemElement.querySelector('[name="Inventory_Product_Name"]').value;
            const product = inventoryProductsData.find(p => p.Product_Name_AR === productName);

            if (!product) {
                showErrorMessage(`المنتج "${productName}" غير موجود في قائمة منتجات الجرد أو لم يتم اختياره بشكل صحيح.`);
                submitBtn.disabled = false;
                loadingSpinner.classList.add('hidden');
                throw new Error("منتج جرد غير صحيح."); // إيقاف التنفيذ
            }

            inventoryItems.push({
                Inventory_ID: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, // معرف فريد لكل عنصر جرد
                Timestamp: currentTimestamp,
                Entry_User_Name: entryUserName,
                Sales_Rep_Name_AR: salesRepName,
                Customer_Name_AR: customerName,
                Customer_Code: customerCode,
                Visit_Group_ID: visitGroupID, // ربط كل عناصر الجرد بنفس معرف المجموعة
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
                Notes: itemElement.querySelector('[name="Inventory_Notes"]').value, // ملاحظات خاصة بمنتج الجرد
                General_Notes: generalNotesValue, // ملاحظات عامة من النموذج الرئيسي
            });
        });

        payload.data = inventoryItems;
        payload.sheetName = 'Inventory_Logs'; // اسم الشيت للجرد
    } else {
        // جمع بيانات الزيارات العادية
        const visitPurpose = document.getElementById('visitPurpose').value;
        const visitOutcome = document.getElementById('visitOutcome').value;

        // التأكد من اختيار الغرض والنتيجة للزيارات العادية
        if (!visitPurpose || !visitOutcome) {
            showWarningMessage('الرجاء اختيار الغرض والنتائج من الزيارة.');
            submitBtn.disabled = false;
            loadingSpinner.classList.add('hidden');
            return;
        }

        const visitLogs = [];
        const visitId = `VISIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`; // معرف فريد للزيارة

        // جمع بيانات توفر المنتجات من `selectedProductsStatus`
        const availableProducts = [];
        const unavailableProducts = [];
        for (const productName in selectedProductsStatus) {
            const statusInfo = selectedProductsStatus[productName];
            if (statusInfo.status === 'متوفر') {
                availableProducts.push(productName);
            } else if (statusInfo.status === 'غير متوفر') {
                unavailableProducts.push(productName);
            }
        }
        
        // التحقق من تحديد حالة المنتجات إذا كان نوع الزيارة يتطلب ذلك
        // يمكن تعديل هذا الشرط ليشمل فقط أنواع الزيارات التي تتطلب تقرير المنتجات
        const requiresProductStatus = ['زيارة بيع', 'زيارة تحصيل', 'زيارة متابعة'].includes(selectedMainVisitType);
        if (requiresProductStatus && (availableProducts.length === 0 && unavailableProducts.length === 0)) {
            showWarningMessage('الرجاء تحديد حالة توفر المنتجات (متوفر/غير متوفر) للزيارة.');
            submitBtn.disabled = false;
            loadingSpinner.classList.add('hidden');
            return;
        }

        visitLogs.push({
            Timestamp: currentTimestamp,
            Date: currentDate,
            Time: currentTime,
            Visit_Group_ID: visitGroupID, // نفس معرف المجموعة للزيارة الواحدة
            Visit_ID: visitId, // معرف خاص بهذه الزيارة
            Entry_User_Name: entryUserName,
            Sales_Rep_Name_AR: salesRepName,
            Customer_Name_AR: customerName,
            Customer_Code: customerCode,
            Customer_Type: customerType,
            Visit_Type_Name_AR: selectedMainVisitType,
            Visit_Purpose_AR: visitPurpose,
            Visit_Outcome_AR: visitOutcome,
            // سيتم إرسال المنتجات كقائمة مفصولة بفواصل
            Available_Products_Names: availableProducts.join(', '),
            Unavailable_Products_Names: unavailableProducts.join(', '),
            Visit_Notes: document.getElementById('visitNotes')?.value || '', // ملاحظات خاصة بالزيارة الواحدة (إذا كانت موجودة)
            General_Notes: generalNotesValue, // ملاحظات عامة من النموذج الرئيسي
        });

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

        showSuccessMessage();
        visitForm.reset(); // إعادة تعيين النموذج

        // إعادة تهيئة النموذج بعد الإرسال
        selectedProductsStatus = {}; // مسح حالة المنتجات المحددة
        productsDisplayDiv.innerHTML = ''; // مسح المنتجات المعروضة
        productCategoriesDiv.innerHTML = ''; // مسح فئات المنتجات
        inventoryItemsContainer.innerHTML = ''; // مسح عناصر الجرد

        // إعادة تعبئة البيانات الأولية وعرض الأقسام الافتراضية
        await loadAllData(); // يعيد تعبئة القوائم ويهيئ الفئات والمنتجات العادية أو الجرد
        // loadAllData() سيستدعي toggleVisitSections() والتي ستعيد إعداد الأقسام بشكل صحيح
        // setupNormalVisitFields(); // يتم استدعاؤها داخل toggleVisitSections
        // addInventoryItem(true); // يتم استدعاؤها داخل toggleVisitSections
        
        // إعادة تعيين العدادات لضمان بدء العد من 1 للعنصر الأول بعد إعادة التعيين
        inventoryItemCounter = 0;

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

    visitForm.addEventListener('submit', handleSubmit); // ربط دالة الإرسال بحدث submit للنموذج

    // ربط حدث التغيير لنوع الزيارة لتبديل الأقسام
    visitTypeSelect.addEventListener('change', (event) => {
        toggleVisitSections(event.target.value);
    });

    // ربط زر إضافة منتج جرد
    addInventoryItemBtn.addEventListener('click', () => addInventoryItem(false));

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
