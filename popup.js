//extension UI
const drugList = document.getElementById('drug-list');

const dateInputs = [...document.getElementsByClassName('date')];
let day = document.getElementById('day');
let month = document.getElementById('month')
let year = document.getElementById('year');
const noteInput = document.getElementById('note');

const addToDrugListBtn = document.getElementById('add-drug-btn');
const modal = document.getElementById('add-drug-modal');
const modalInputs = [...document.getElementsByClassName('modal-input')];
//modal add button
const addToListBtn = document.getElementById('add-to-list-btn');
//modal modify button
const modifyDrugBtn = document.getElementById('modify-drug-btn')
const closeModalBtn = document.getElementById('close-modal-btn');

const error = document.getElementById('error');

//delete drug modal UI
const deleteDrugModal = document.getElementById('delete-drug-modal');
const okButton = document.getElementById('ok-btn');
const discardButton = document.getElementById('discard-btn');

let qty = 0;

let drugs = [];

let drugToModify = {
  id: null,
  name: null,
  code: null,
  price: null,
  order: null
}

let currentDrug = {
  id: null,
  name: null,
  code: null,
  price: null,
  order: null
};

//this flag differentiate between adding and modification
let modifyFlag = false;
//this variable receives id of the drug to delete once clicking delete
let drugToDeleteIdx = null;

chrome.storage.sync.get('storedDrugs', ({ storedDrugs }) => {
  drugs = [...storedDrugs];
  renderDrugList(drugs);
})

//get added drug info when changing modal input values
modalInputs.forEach(input => {
  let { id } = input.dataset;
  input.addEventListener('change', () => {
    if (id === 'code' || id === 'price' || id === 'order') {
      currentDrug = { ...currentDrug, [id]: Number(input.value) }
    } else {
      currentDrug = { ...currentDrug, [id]: input.value }
    }
  })
});

//modal add button
addToListBtn.addEventListener('click', addDrugToList);
//modal modify button
modifyDrugBtn.addEventListener('click', modifyDrug);

addToDrugListBtn.addEventListener('click', openModal);

closeModalBtn.addEventListener('click', closeModal);

okButton.addEventListener('click', () => {
  deleteDrug(drugToDeleteIdx);
  closeDeleteDrugModal();
})

discardButton.addEventListener('click', closeDeleteDrugModal);

function renderDrugList(drugs) {
  console.log(drugs)
  //removing the drug list before rendering it again according to the new data
  drugList.innerHTML = '';
  //rendering the drug list according to stored or modified data
  drugs.forEach(drug => {
    drugList.innerHTML += `<li class="drug-item">
                              <button class="modify-btn" data-id=${drug.id}>تعديل</button>                            
                              <button 
                                data-name="${drug.name}"
                                data-price="${drug.price}"
                                class="add-btn"
                                tabindex=1
                              ><span id="add-btn-label">+</span></button>
                              <input 
                                 class="drug-input"
                                 data-code="${drug.code}"
                                 placeholder="${drug.name}"
                              />
                              <span 
                                class="delete-btn"
                                data-id=${drug.id}
                              >X</span>
                           </li>`
  })


  let drugInputs = [...document.getElementsByClassName('drug-input')];
  let addButtons = [...document.getElementsByClassName('add-btn')];
  const modifyBtns = [...document.getElementsByClassName('modify-btn')];
  const deleteBtns = [...document.getElementsByClassName('delete-btn')];

  modifyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modifyFlag = true;
      let { id } = btn.dataset;
      drugToModify = drugs.filter(drug => drug.id == id)[0];
      currentDrug = { ...drugToModify };
      openModal()
    });
  });

  deleteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      drugToDeleteIdx = btn.dataset.id;
      openDeleteDrugModal();
    });
  })

  drugInputs.forEach(drugInput => {
    drugInput.addEventListener('focus', () => {
      drugInputs.forEach(drugInput => drugInput.value = null)
      getDrug(drugInput.dataset.code);
    })
  })

  drugInputs.forEach(drugInput => {
    drugInput.addEventListener('change', () => qty = drugInput.value)
  })

  addButtons.forEach(addBtn => {
    addBtn.addEventListener('click', () => {
      let { price, name } = addBtn.dataset;
      addDrug(price, name);
      setDate();
      //removing all input values after clicking any add button
      drugInputs.forEach(drugInput => drugInput.value = null)
    })
  });

  dateInputs.forEach(dateInput => {
    dateInput.addEventListener('change', setDate)
  })

  //get stored date to show once extension get opened
  chrome.storage.sync.get("date", ({ date }) => {
    day.value = date.day;
    month.value = date.month;
    year.value = date.year;
  })

  //showing stored notes
  noteInput.addEventListener('change', setNote)
  chrome.storage.sync.get('note', ({ note }) => noteInput.value = note)
}

async function getDrug(code) {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: enterDrugCode,
    args: [code]
  })
}

function enterDrugCode(code) {
  const drugCode = document.getElementById('drugCode');
  const searchDrugByCodeBtn = document.getElementsByClassName('btn-default')[0];
  drugCode.value = code;
  searchDrugByCodeBtn.click();
}

async function addDrug(price, name) {
  const dayVal = day.value;
  const monthVal = month.value;
  const yearVal = year.value;
  const noteVal = document.getElementById('note').value;

  let storedDate = { dayVal, monthVal, yearVal }
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: populateDrugValues,
    args: [price, qty, storedDate, noteVal, name]
  })
}

function populateDrugValues(price, qty, date, note, name) {
  const addDrugBtn = document.getElementById('addDrugBtn');

  const checkbox = document.getElementsByClassName('dt-checkboxes')[0];
  const quantity = document.getElementsByClassName('Quantity')[0];
  const priceInput = document.getElementsByClassName('TotalSellingPrice')[0];
  const noteInput = document.getElementsByClassName('notes')[0];
  //formating the date before inserting
  const formattedMonth = date.monthVal > 9 ? `${date.monthVal}` : `0${date.monthVal}`;
  const formattedDay = date.dayVal > 9 ? `${date.dayVal}` : `0${date.dayVal}`;
  const dateInput = document.getElementsByClassName('Date')[0];
  const formattedDate = `${date.yearVal}-${formattedMonth}-${formattedDay}`;

  //populating drug values
  //checking drug checkbox
  checkbox.checked = true;
  //adding total price
  priceInput.value = (Number(qty * price + (qty * price * 0.07)).toFixed(2));
  //adding qty
  quantity.value = qty;
  //adding date
  dateInput.value = formattedDate;
  //adding notes
  noteInput.value = note + `-${name}`;

  addDrugBtn.click()
}
//this function store the inserted date
function setDate() {
  const date = { day: day.value, month: month.value, year: year.value }
  chrome.storage.sync.set({ date });
}
//this function store the inserted note
function setNote() {
  const note = document.getElementById('note').value;
  chrome.storage.sync.set({ note });
}

function openModal() {
  error.innerHTML = '';

  if (modifyFlag) {
    addToListBtn.style.display = 'none';
    modifyDrugBtn.style.display = 'flex';
    modifyFlag = false;
  } else {
    addToListBtn.style.display = 'flex';
    modifyDrugBtn.style.display = 'none';
  }
  //populating modal inputs with null values in case of adding a new drug or real values
  //in case of modifying an existing drug
  modalInputs.forEach(input => {
    input.value = currentDrug[input.dataset.id]
  })

  modal.classList.remove('closed')
  modal.classList.add('opened');
  drugList.style.display = 'none';
}

function openDeleteDrugModal() {
  deleteDrugModal.style.display = 'block';
}

function closeDeleteDrugModal() {
  deleteDrugModal.style.display = 'none';
}

function closeModal() {
  error.innerHTML = ''
  //defaulting back currentDrug fields with null values
  currentDrug = {
    id: null,
    name: null,
    code: null,
    price: null,
    order: null
  };

  modal.classList.remove('opened');
  modal.classList.add('closed');
  drugList.style.display = 'flex';
}

function saveDrug() {
  //render the drug list with the new data
  renderDrugList(drugs);
  //store the new list of drugs
  chrome.storage.sync.set({ storedDrugs: drugs });
  //defaulting back currentDrug
  currentDrug = {
    id: null,
    name: null,
    code: null,
    price: null,
    order: null
  };

  closeModal();
  //once modal is closed, all modal input values get lost
  modalInputs.forEach(modalInput => modalInput.value = null);
}

function addDrugToList() {
  let { name, code, price, order } = currentDrug;
  let newDrugs = [...drugs];
  let id = Math.random().toString(36).substr(2, 9);
  let drugNewIndex;

  if (name && code && price) {
    if (order) {
      drugNewIndex = order - 1;
      newDrugs.splice(drugNewIndex, 0, { ...currentDrug, id });
      newDrugs.forEach((drug, i) => drug.order = i + 1)
      drugs = [...newDrugs];
    } else {
      //append it 
      drugs = [...drugs, { ...currentDrug, id, order: drugs.length + 1 }];
    }

    saveDrug();
  } else {
    error.innerHTML = 'Please, fill fields with right data'
    error.style.visibility = 'visible';
  }
}

function modifyDrug() {
  let { name, code, price, order } = currentDrug;
  let newDrugs = [...drugs];
  //index of drug  to modify
  let index = drugs.findIndex(drug => drug.id === drugToModify.id);
  //moving element up and down
  let drugNewIndex = index >= order ? order - 1 : order;

  if (name && code && price) {
    if (order) {
      newDrugs.splice(drugNewIndex, 0, { ...currentDrug });
      index >= order ? newDrugs.splice(index + 1, 1) : newDrugs.splice(index, 1);
      newDrugs.forEach((drug, i) => drug.order = i + 1);
    } else {
      newDrugs[index] = { ...currentDrug }
    }
    drugs = [...newDrugs];
    saveDrug();
  } else {
    error.innerHTML = 'Please, fill fields with right data'
    error.style.visibility = 'visible';
  }
}

function deleteDrug(id) {
  drugs = drugs.filter(drug => drug.id != id);
  renderDrugList(drugs);
  chrome.storage.sync.set({ storedDrugs: drugs });
}

// chrome.storage.sync.set({storedDrugs: []})
// let drugs = [
//   {
//     name: "Insulin",
//     code: 3208,
//     price: 41.9895,
//     actual: "انسولين"
//   },
//   {
//     name: "Farcovit",
//     code: 4952,
//     price: 0.41685,
//     actual: "فاركوفيت"
//   },
//   {
//     name: "Stomigas",
//     price: 0.49875,
//     code: 3384,
//     actual: "ستوميجاز"
//   },
//   {
//     name: "Flash-act",
//     code: 2953,
//     price: 0.6,
//     actual: "فلاش-اكت"
//   },
//   {
//     name: "ٌRositor",
//     code: 3655,
//     price: 1.5,
//     actual: "روسيتور"
//   },
//   {
//     name: "Amaryl",
//     price: 1.01325,
//     code: 4810,
//     actual: "اماريل"
//   },
//   {
//     name: "Ikandra",
//     code: 3104,
//     price: 0.874965,
//     actual: "ايكندرا"
//   },
//   {
//     name: "Cidophage-500",
//     code: 3467,
//     price: 0.148,
//     actual: "ميبافاج "
//   },
//   {
//     name: "candi",
//     code: 2822,
//     price: 1.18,
//     actual: "كاندى"
//   },
//   {
//     name: "Egypro",
//     code: 2786,
//     price: 0.1512,
//     actual: "ايجى-برو5"
//   },
//   {
//     name: "Omez 20",
//     price: 0.37,
//     code: 3384,
//     actual: "اوميز-20"
//   },
//   {
//     name: "Clatex",
//     code: 2890,
//     price: 0.293,
//     actual: "كلاتكس اقراص"
//   },
//   {
//     name: "Nitromak",
//     code: 3061,
//     price: 0.39897,
//     actual: "نيتروماك"
//   },
//   {
//     name: "Cardiocare",
//     code: 636,
//     price: 0.2973,
//     actual: "كارديوكير"
//   },
//   {
//     name: "Aspocid",
//     code: 308,
//     price: 0.315,
//     actual: "اسبوسيد75"
//   },
//   {
//     name: "Vental",
//     code: 3658,
//     price: 26.25,
//     actual: "فنتال"
//   },
//   {
//     name: "Paracetamol",
//     code: 3421,
//     price: 0.1848,
//     actual: "بارامول اقراص"
//   },
//   {
//     name: "Eprex",
//     code: 4943,
//     price: 33.81,
//     actual: "ايبريكس"
//   },
//   {
//     name: "Bonecare-0.5",
//     code: 2547,
//     price: 0.976,
//     actual: "بونكير 0.5 اقراص"
//   },
//   {
//     name: "Bonecare-1-Micro",
//     code: 2608,
//     price: 1.05,
//     actual: "بونكير 1 ميكرو اقراص"
//   },
//   {
//     name: "Cal-Preg",
//     code: 4738,
//     price: 0.664,
//     actual: "كالسيوم اقراص"
//   },
//   {
//     name: "Eposino",
//     code: 3936,
//     price: 54.39,
//     actual: "ايبوزينو-سرنجة"
//   },
//   {
//     name: "Diamedazen-30",
//     code: 3042,
//     price: 0.282,
//     actual: "دياميدازين-30"
//   }
// ];