const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbym4rVEUWd0xkp9JglZNkZp6Hse6IxGSkHgqqKsi05GJhwe2AD95Z1-bGCv7dhWMLBqXQ/exec'; // ← ضع رابطك هنا

let productsData = [], inventoryProductsData = [], customersMain = [], visitOutcomes = [], visitPurposes = [], visitTypes = [], salesRepresentatives = [];
let visitCounter = 0; // لتعقب عدد الزيارات المضافة ديناميكيًا

// عناصر DOM الرئيسية
const visitForm = document.getElementById('visitForm');
const entryUserNameInput = document.getElementById('entryUserName'); // جديد: اسم الموظف المدخل
const customerNameInput = document.getElementById('customerName');
const customerListDatalist = document.getElementById('customerList');
const visitTypeSelect = document.getElementById('visitType');
const visitPurposeSelect = document.getElementById('visitPurpose');
const visitOutcomeSelect = document.getElementById('visitOutcome');
const salesRepNameSelect = document.getElementById('salesRepName');
const customerTypeSelect = document.getElementById('customerType');
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const productsDisplayDiv = document.getElementById('productsDisplay');
const productCategoriesDiv = document.getElementById('productCategories');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');
const inventorySectionDiv = document.getElementById('inventorySection');
const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields');
const notesTextarea = document.getElementById('notes');

// عناصر سجل الزيارات (جديد / معدل)
const clientVisitHistoryBox = document.getElementById('clientVisitHistoryBox');
const clientHistoryList = document.getElementById('clientHistoryList');

// عناصر الزيارات المتعددة (جديد / معدل)
const visitEntriesContainer = document.getElementById('visitEntriesContainer');
const addVisitEntryBtn = document.getElementById('addVisitEntry');


// 1. وظائف جلب البيانات الأولية
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire('خطأ!', 'فشل في تحميل البيانات الأساسية: ' + error.message, 'error');
        return [];
    }
}

async function initializeData() {
    [
        productsData,
        inventoryProductsData,
        customersMain,
        visitOutcomes,
        visitPurposes,
        visitTypes,
        salesRepresentatives
    ] = await Promise.all([
        fetchData(GOOGLE_SHEETS_WEB_APP_URL + '?action=getProducts'),
        fetchData(GOOGLE_SHEETS_WEB_APP_URL + '?action=getInventoryProducts'),
        fetchData(GOOGLE_SHEETS_WEB_APP_URL + '?action=getCustomers'),
        fetchData(GOOGLE_SHEETS_WEB_APP_URL + '?action=getVisitOutcomes'),
        fetchData(GOOGLE_SHEETS_WEB_APP_URL + '?action=getVisitPurposes'),
        fetchData(GOOGLE_SHEETS_WEB_APP_URL + '?action=getVisitTypes'),
        fetchData(GOOGLE_SHEETS_WEB_APP_URL + '?action=getSalesRepresentatives')
    ]);

    populateDatalist(customerListDatalist, customersMain, 'Customer_Name_AR');
    populateSelect(salesRepNameSelect, salesRepresentatives, 'Sales_Rep_Name_AR');
    populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR');
    populateSelect(visitPurposeSelect, visitPurposes, 'Visit_Purpose_AR');
    populateSelect(visitOutcomeSelect, visitOutcomes, 'Visit_Outcome_AR');
    populateDatalist(document.getElementById('inventoryList'), inventoryProductsData, 'Product_Name_AR');

    setupProductCategories(productsData);
    addInventoryItem(); // أضف عنصر جرد واحد عند التحميل الأولي
}

function populateDatalist(datalistElement, data, valueKey) {
    datalistElement.innerHTML = '';
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        datalistElement.appendChild(option);
    });
}

function populateSelect(selectElement, data, valueKey) {
    selectElement.innerHTML = '<option value="">اختر</option>';
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        option.textContent = item[valueKey];
        selectElement.appendChild(option);
    });
}

// 2. إدارة أقسام الزيارة والجرد
visitTypeSelect.addEventListener('change', () => {
    const selectedType = visitTypeSelect.value;
    if (selectedType === 'جرد استثنائي') {
        normalVisitRelatedFieldsDiv.classList.add('hidden');
        inventorySectionDiv.classList.remove('hidden');
        // إزالة الحقول المطلوبة للزيارة العادية
        visitPurposeSelect.removeAttribute('required');
        visitOutcomeSelect.removeAttribute('required');
        customerTypeSelect.removeAttribute('required');

        // اجعل حقول الجرد مطلوبة
        document.querySelectorAll('#inventoryItemsContainer input[required], #inventoryItemsContainer select[required]').forEach(el => el.setAttribute('required', ''));
    } else {
        normalVisitRelatedFieldsDiv.classList.remove('hidden');
        inventorySectionDiv.classList.add('hidden');
        // إعادة الحقول المطلوبة للزيارة العادية
        visitPurposeSelect.setAttribute('required', '');
        visitOutcomeSelect.setAttribute('required', '');
        customerTypeSelect.setAttribute('required', '');

        // إزالة الحقول المطلوبة للجرد
        document.querySelectorAll('#inventoryItemsContainer input[required], #inventoryItemsContainer select[required]').forEach(el => el.removeAttribute('required'));
    }
});

// 3. إدارة فئات المنتجات والمنتجات
function setupProductCategories(products) {
    const categories = [...new Set(products.map(p => p.Category))];
    productCategoriesDiv.innerHTML = '';
    categories.forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-button'; // استخدم الفئة المخصصة لـ CSS
        button.textContent = category;
        button.dataset.category = category;
        button.addEventListener('click', () => {
            document.querySelectorAll('.category-button').forEach(btn => btn.classList.remove('bg-blue-600', 'text-white'));
            button.classList.add('bg-blue-600', 'text-white');
            displayProducts(category, products);
        });
        productCategoriesDiv.appendChild(button);
    });
}

function displayProducts(category, products) {
    productsDisplayDiv.innerHTML = '';
    const filteredProducts = products.filter(p => p.Category === category);

    filteredProducts.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item'; // استخدم الفئة المخصصة لـ CSS
        productItem.innerHTML = `
            <span class="font-semibold text-gray-800">${product.Product_Name_AR}</span>
            <div class="flex items-center space-x-2 space-x-reverse">
                <input type="number" class="product-quantity w-24 p-2 border rounded text-right" placeholder="الكمية" min="0" data-product-code="${product.Product_Code}" value="0">
                <span class="text-gray-600">${product.Unit_Label}</span>
            </div>
            <div class="product-condition-group flex items-center space-x-4 space-x-reverse">
                <label class="radio-group inline-flex items-center text-gray-700">
                    <input type="radio" name="condition-${product.Product_Code}" value="جيد" class="form-radio h-4 w-4 text-green-600" checked>
                    <span class="ml-1">جيد</span>
                </label>
                <label class="radio-group inline-flex items-center text-gray-700">
                    <input type="radio" name="condition-${product.Product_Code}" value="تالف" class="form-radio h-4 w-4 text-red-600">
                    <span class="ml-1">تالف</span>
                </label>
            </div>
        `;
        productsDisplayDiv.appendChild(productItem);
    });
}

// 4. إدارة عناصر الجرد الديناميكية
function addInventoryItem() {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'inventory-item border border-yellow-200 p-4 rounded-lg bg-white relative';
    itemDiv.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700">البحث عن المنتج</label>
                <input type="text" name="Inventory_Product_Name_AR" list="inventoryList" placeholder="ابحث عن المنتج..." class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500" required />
            </div>
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700">الكمية</label>
                <input type="number" name="Inventory_Quantity" min="1" placeholder="أدخل الكمية" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500" required />
            </div>
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700">تاريخ الانتهاء (اختياري)</label>
                <input type="date" name="Expiration_Date" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500" />
            </div>
            <div class="form-group">
                <label class="block text-sm font-medium text-gray-700">الوحدة</label>
                <select name="Unit_Label" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500" required>
                    <option value="">اختر الوحدة</option>
                    <option value="علبة">علبة</option>
                    <option value="شد">شد</option>
                    <option value="باكت">باكت</option>
                    <option value="كرتون">كرتون</option>
                </select>
            </div>
             <div class="form-group md:col-span-2">
                <label class="block text-sm font-medium text-gray-700">ملاحظات المنتج (اختياري)</label>
                <textarea name="Product_Notes" rows="2" placeholder="ملاحظات خاصة بهذا المنتج..." class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"></textarea>
            </div>
        </div>
        <button type="button" class="removeInventoryItem absolute top-2 left-2 text-red-600 hover:text-red-800 text-sm font-semibold">❌ حذف</button>
    `;
    inventoryItemsContainer.appendChild(itemDiv);

    // إضافة مستمعي الأحداث للعناصر المطلوبة
    const requiredInputs = itemDiv.querySelectorAll('input[required], select[required]');
    if (visitTypeSelect.value === 'جرد استثنائي') {
        requiredInputs.forEach(el => el.setAttribute('required', ''));
    } else {
        requiredInputs.forEach(el => el.removeAttribute('required'));
    }
}
addInventoryItemBtn.addEventListener('click', addInventoryItem);


// 5. إدارة إدخالات الزيارة المتعددة
function addVisitEntry() {
    visitCounter++;
    const visitEntryDiv = document.createElement('div');
    visitEntryDiv.id = `visitEntry-${visitCounter}`;
    visitEntryDiv.className = 'visit-entry bg-indigo-50 p-6 rounded-xl border border-indigo-200 mb-6 relative';
    visitEntryDiv.innerHTML = `
        <h3 class="text-lg font-bold text-indigo-800 mb-4">تفاصيل الزيارة رقم ${visitCounter}</h3>
        <div class="form-group">
            <label for="visitPurpose-${visitCounter}">غرض الزيارة</label>
            <select id="visitPurpose-${visitCounter}" name="Visit_Purpose" class="mt-1" required>
                <option value="">اختر غرض الزيارة</option>
            </select>
        </div>
        <div class="form-group">
            <label for="visitOutcome-${visitCounter}">نتيجة الزيارة</label>
            <select id="visitOutcome-${visitCounter}" name="Visit_Outcome" class="mt-1" required>
                <option value="">اختر نتيجة الزيارة</option>
            </select>
        </div>
        <div class="form-group">
            <label for="customerType-${visitCounter}">نوع العميل</label>
            <select id="customerType-${visitCounter}" name="Customer_Type" class="mt-1" required>
                <option value="">اختر نوع العميل</option>
                <option value="حلويات">حلويات 🍬</option>
                <option value="غذائية">غذائية 🍞</option>
                <option value="عام">عام 🛒</option>
            </select>
        </div>

        <div class="product-selection-section bg-gray-50 p-6 rounded-xl border border-gray-200 mt-6">
            <h2 class="text-xl font-bold text-gray-700 mb-4">اختيار المنتجات حسب التصنيف</h2>
            <div id="productCategories-${visitCounter}" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6"></div>
            <div id="productsDisplay-${visitCounter}" class="space-y-4"></div>
        </div>
        <button type="button" class="removeVisitEntry absolute top-2 left-2 text-red-600 hover:text-red-800 text-sm font-semibold">❌ حذف الزيارة</button>
    `;
    visitEntriesContainer.appendChild(visitEntryDiv);

    // Populate selects for the new entry
    populateSelect(document.getElementById(`visitPurpose-${visitCounter}`), visitPurposes, 'Visit_Purpose_AR');
    populateSelect(document.getElementById(`visitOutcome-${visitCounter}`), visitOutcomes, 'Visit_Outcome_AR');

    // Setup product categories for the new entry
    setupProductCategoriesForEntry(productsData, visitCounter);

    // Hide normal sections if multi-visit is active
    normalVisitRelatedFieldsDiv.classList.add('hidden');
    productsDisplayDiv.classList.add('hidden'); // Hide global products display
    productCategoriesDiv.classList.add('hidden'); // Hide global product categories
}
addVisitEntryBtn.addEventListener('click', addVisitEntry);


function setupProductCategoriesForEntry(products, entryId) {
    const categories = [...new Set(products.map(p => p.Category))];
    const categoryContainer = document.getElementById(`productCategories-${entryId}`);
    categoryContainer.innerHTML = '';
    categories.forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-button'; // استخدم الفئة المخصصة لـ CSS
        button.textContent = category;
        button.dataset.category = category;
        button.addEventListener('click', () => {
            document.querySelectorAll(`#productCategories-${entryId} .category-button`).forEach(btn => btn.classList.remove('bg-blue-600', 'text-white'));
            button.classList.add('bg-blue-600', 'text-white');
            displayProductsForEntry(category, products, entryId);
        });
        categoryContainer.appendChild(button);
    });
}

function displayProductsForEntry(category, products, entryId) {
    const productsDisplay = document.getElementById(`productsDisplay-${entryId}`);
    productsDisplay.innerHTML = '';
    const filteredProducts = products.filter(p => p.Category === category);

    filteredProducts.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item'; // استخدم الفئة المخصصة لـ CSS
        productItem.innerHTML = `
            <span class="font-semibold text-gray-800">${product.Product_Name_AR}</span>
            <div class="flex items-center space-x-2 space-x-reverse">
                <input type="number" class="product-quantity w-24 p-2 border rounded text-right" placeholder="الكمية" min="0" data-product-code="${product.Product_Code}" value="0">
                <span class="text-gray-600">${product.Unit_Label}</span>
            </div>
            <div class="product-condition-group flex items-center space-x-4 space-x-reverse">
                <label class="radio-group inline-flex items-center text-gray-700">
                    <input type="radio" name="condition-${product.Product_Code}-${entryId}" value="جيد" class="form-radio h-4 w-4 text-green-600" checked>
                    <span class="ml-1">جيد</span>
                </label>
                <label class="radio-group inline-flex items-center text-gray-700">
                    <input type="radio" name="condition-${product.Product_Code}-${entryId}" value="تالف" class="form-radio h-4 w-4 text-red-600">
                    <span class="ml-1">تالف</span>
                </label>
            </div>
        `;
        productsDisplay.appendChild(productItem);
    });
}

// 6. إدارة حذف العناصر ديناميكيًا
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('removeInventoryItem')) {
        event.target.closest('.inventory-item').remove();
    }
    if (event.target.classList.contains('removeVisitEntry')) {
        event.target.closest('.visit-entry').remove();
        // Show normal sections if all multi-visit entries are removed
        if (visitEntriesContainer.children.length === 0) {
            normalVisitRelatedFieldsDiv.classList.remove('hidden');
            productsDisplayDiv.classList.remove('hidden');
            productCategoriesDiv.classList.remove('hidden');
        }
    }
});

// 7. جلب سجل الزيارات للعميل
customerNameInput.addEventListener('change', async () => {
    const customerName = customerNameInput.value;
    const customer = customersMain.find(c => c.Customer_Name_AR === customerName);

    if (customer && customer.Customer_Code) {
        try {
            const history = await fetchData(`${GOOGLE_SHEETS_WEB_APP_URL}?action=getClientHistory&customerCode=${customer.Customer_Code}`);
            displayClientHistory(history);
        } catch (error) {
            console.error('Error fetching client history:', error);
            showErrorMessage('فشل في جلب سجل زيارات العميل.');
            clientVisitHistoryBox.classList.add('hidden');
        }
    } else {
        clientVisitHistoryBox.classList.add('hidden');
        clientHistoryList.innerHTML = '';
    }
});

function displayClientHistory(history) {
    clientHistoryList.innerHTML = '';
    if (history && history.length > 0) {
        clientVisitHistoryBox.classList.remove('hidden');
        history.forEach(visit => {
            const listItem = document.createElement('li');
            listItem.textContent = `${visit.Visit_Date} - ${visit.Visit_Type_Name_AR} - ${visit.Visit_Outcome}`;
            clientHistoryList.appendChild(listItem);
        });
    } else {
        clientVisitHistoryBox.classList.add('hidden');
    }
}


// 8. وظائف إرسال النموذج
visitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    loadingSpinner.classList.remove('hidden');

    const visitGroupID = `GROUP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const formData = new FormData(visitForm);
    const commonData = {
        Entry_User_Name: entryUserNameInput.value, // جديد
        Sales_Rep_Name_AR: formData.get('Sales_Rep_Name_AR'),
        Customer_Name_AR: formData.get('Customer_Name_AR'),
        Customer_Code: customersMain.find(c => c.Customer_Name_AR === formData.get('Customer_Name_AR'))?.Customer_Code || '',
        Visit_Date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
        Visit_Time: new Date().toLocaleTimeString('en-US', { hour12: false }), // HH:MM:SS
        Visit_Group_ID: visitGroupID,
        Notes: notesTextarea.value,
        Merge_Note: '' // هذا الحقل سيتم تعبئته لاحقًا بواسطة سكريبت Apps Script إذا لزم الأمر
    };

    let payload = { action: '', sheetName: '', data: [] };

    const selectedVisitType = visitTypeSelect.value;

    if (selectedVisitType === 'جرد استثنائي') {
        payload.action = 'addInventoryLog';
        payload.sheetName = 'Inventory_Logs';
        const inventoryItems = [];
        document.querySelectorAll('.inventory-item').forEach(itemDiv => {
            const itemName = itemDiv.querySelector('[name="Inventory_Product_Name_AR"]').value;
            const product = inventoryProductsData.find(p => p.Product_Name_AR === itemName);
            if (product) {
                inventoryItems.push({
                    ...commonData,
                    Product_Name_AR: itemName,
                    Product_Code: product.Product_Code,
                    Quantity: Number(itemDiv.querySelector('[name="Inventory_Quantity"]').value),
                    Expiration_Date: itemDiv.querySelector('[name="Expiration_Date"]').value,
                    Category: product.Category,
                    Package_Type: product.Package_Type,
                    Unit_Size: product.Unit_Size,
                    Unit_Label: itemDiv.querySelector('[name="Unit_Label"]').value,
                    Product_Condition: 'جيد', // الجرد لا يتطلب حالة تلف
                    Product_Notes: itemDiv.querySelector('[name="Product_Notes"]').value || ''
                });
            }
        });
        payload.data = consolidateInventoryItems(inventoryItems);

    } else if (visitEntriesContainer.children.length > 0) { // If multi-visit entries are added
        payload.action = 'addVisitLog';
        payload.sheetName = 'Visit_Logs';
        const allVisitEntries = [];

        visitEntriesContainer.querySelectorAll('.visit-entry').forEach(entryDiv => {
            const productsForThisEntry = [];
            const productsDisplayForEntry = entryDiv.querySelector('[id^="productsDisplay-"]');

            productsDisplayForEntry.querySelectorAll('.product-item').forEach(item => {
                const quantityInput = item.querySelector('.product-quantity');
                const quantity = Number(quantityInput.value);
                if (quantity > 0) {
                    const productCode = quantityInput.dataset.productCode;
                    const product = productsData.find(p => p.Product_Code === productCode);
                    const condition = item.querySelector(`input[name="condition-${product.Product_Code}-${entryDiv.id.split('-')[1]}"]:checked`).value;

                    productsForThisEntry.push({
                        Product_Name_AR: product.Product_Name_AR,
                        Product_Code: product.Product_Code,
                        Quantity: quantity,
                        Unit_Label: product.Unit_Label,
                        Product_Condition: condition
                    });
                }
            });

            allVisitEntries.push({
                ...commonData,
                Visit_Type_Name_AR: visitTypeSelect.value, // هذا سيكون موحدًا لكل الزيارات الفرعية
                Visit_Purpose_AR: entryDiv.querySelector('[name="Visit_Purpose"]').value,
                Visit_Outcome_AR: entryDiv.querySelector('[name="Visit_Outcome"]').value,
                Customer_Type_AR: entryDiv.querySelector('[name="Customer_Type"]').value,
                Products_Data: JSON.stringify(productsForThisEntry) // Serialize products data
            });
        });
        payload.data = allVisitEntries;

    } else { // Normal single visit
        payload.action = 'addVisitLog';
        payload.sheetName = 'Visit_Logs';
        const selectedProducts = [];
        productsDisplayDiv.querySelectorAll('.product-item').forEach(item => {
            const quantityInput = item.querySelector('.product-quantity');
            const quantity = Number(quantityInput.value);
            if (quantity > 0) {
                const productCode = quantityInput.dataset.productCode;
                const product = productsData.find(p => p.Product_Code === productCode);
                const condition = item.querySelector(`input[name="condition-${product.Product_Code}"]:checked`).value;

                selectedProducts.push({
                    Product_Name_AR: product.Product_Name_AR,
                    Product_Code: product.Product_Code,
                    Quantity: quantity,
                    Unit_Label: product.Unit_Label,
                    Product_Condition: condition
                });
            }
        });
        payload.data = [{
            ...commonData,
            Visit_Type_Name_AR: visitTypeSelect.value,
            Visit_Purpose_AR: visitPurposeSelect.value,
            Visit_Outcome_AR: visitOutcomeSelect.value,
            Customer_Type_AR: customerTypeSelect.value,
            Products_Data: JSON.stringify(selectedProducts) // Serialize products data
        }];
    }

    try {
        const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // يتطلب App Script للتعامل مع CORS
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // بما أن mode هو 'no-cors', لا يمكننا فحص response.ok مباشرة.
        // يجب أن يعتمد تأكيد النجاح على استجابة الـ App Script أو افتراض النجاح
        // إذا لم يكن هناك خطأ في الشبكة.
        showSuccessMessage();
        visitForm.reset();
        clientVisitHistoryBox.classList.add('hidden');
        productsDisplayDiv.innerHTML = '';
        productCategoriesDiv.innerHTML = ''; // أفرغ الفئات أيضًا
        inventoryItemsContainer.innerHTML = '';
        visitEntriesContainer.innerHTML = '';
        addInventoryItem(); // أعد إضافة عنصر الجرد الأولي
        normalVisitRelatedFieldsDiv.classList.remove('hidden'); // أظهر الأقسام العادية
        productsDisplayDiv.classList.remove('hidden');
        productCategoriesDiv.classList.remove('hidden');
        initializeData(); // إعادة تهيئة البيانات لجلب قوائم جديدة إذا لزم الأمر
        // إعادة تهيئة فئات المنتجات للزيارة الواحدة بعد الريست
        //setupProductCategories(productsData); // هذا سيتم بواسطة initializeData
        visitCounter = 0; // إعادة تعيين عداد الزيارات
    } catch (err) {
        console.error('خطأ أثناء الإرسال:', err);
        showErrorMessage('حدث خطأ أثناء إرسال البيانات: ' + err.message);
    } finally {
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
    }
});

// وظائف عرض الرسائل
function showSuccessMessage() {
    Swal.fire({
        title: 'تم الإرسال بنجاح!',
        text: 'تم تسجيل بيانات الزيارة/الجرد بنجاح.',
        icon: 'success',
        confirmButtonText: 'حسناً'
    });
}

function showErrorMessage(message) {
    Swal.fire({
        title: 'خطأ!',
        text: message || 'حدث خطأ ما.',
        icon: 'error',
        confirmButtonText: 'حسناً'
    });
}

// دالة لتجميع المنتجات المكررة في الجرد
function consolidateInventoryItems(items) {
    const consolidated = {};
    items.forEach(item => {
        const key = `${item.Product_Code}-${item.Expiration_Date}-${item.Unit_Label}`;
        if (consolidated[key]) {
            consolidated[key].Quantity += item.Quantity;
        } else {
            consolidated[key] = { ...item };
        }
    });
    return Object.values(consolidated);
}


// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeData);
