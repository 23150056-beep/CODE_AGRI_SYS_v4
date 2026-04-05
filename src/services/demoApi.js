import { AUTH_STORAGE_KEY } from '../constants/auth'

const DEMO_DB_STORAGE_KEY = 'agri_dms_demo_db_v1'
const DEMO_DB_VERSION = 1

const ALLOWED_DISTRIBUTOR_STATUSES = new Set(['Delivered', 'Delayed', 'Rescheduled'])
const DISTRIBUTION_RELEASE_FLOW_STATUSES = new Set([
  'Released',
  'Delivered',
  'Delayed',
  'Rescheduled',
])

function toIsoDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function toIsoDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString()
  return date.toISOString()
}

function dateOffset(days) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

function dateTimeOffset(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toIsoDateTime(date)
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizePath(url) {
  const raw = String(url || '').split('?')[0]
  const trimmed = raw.replace(/^\/+|\/+$/g, '')
  return trimmed
}

function parseBooleanParam(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function parseAccessToken(token) {
  const match = String(token || '').match(/^demo-(?:access|refresh)-(\d+)$/)
  if (!match) return null
  return Number(match[1])
}

function makeAccessToken(userId) {
  return `demo-access-${userId}`
}

function makeRefreshToken(userId) {
  return `demo-refresh-${userId}`
}

function readAuthSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function makeError(status, data, request) {
  const error = new Error(data?.detail || 'Request failed')
  error.response = { status, data }
  error.config = {
    method: request.method,
    url: request.url,
    data: request.data,
    params: request.config?.params,
  }
  return error
}

function throwError(status, data, request) {
  throw makeError(status, data, request)
}

function loadDb() {
  const raw = localStorage.getItem(DEMO_DB_STORAGE_KEY)

  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.meta?.version === DEMO_DB_VERSION) {
        return parsed
      }
    } catch {
      // Ignore malformed demo DB and re-seed below.
    }
  }

  const seeded = createSeedDb()
  saveDb(seeded)
  return seeded
}

function saveDb(db) {
  localStorage.setItem(DEMO_DB_STORAGE_KEY, JSON.stringify(db))
}

function createSeedDb() {
  const now = new Date().toISOString()

  const roles = [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Staff' },
    { id: 3, name: 'Farmer' },
    { id: 4, name: 'Distributor' },
  ]

  const users = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@bauang.local',
      password: 'ChangeMe123!',
      is_active: true,
      date_joined: dateTimeOffset(-100),
      roles: ['Admin'],
    },
    {
      id: 2,
      username: 'staff',
      email: 'staff@bauang.local',
      password: 'ChangeMe123!',
      is_active: true,
      date_joined: dateTimeOffset(-95),
      roles: ['Staff'],
    },
    {
      id: 3,
      username: 'farmer',
      email: 'farmer@bauang.local',
      password: 'ChangeMe123!',
      is_active: true,
      date_joined: dateTimeOffset(-90),
      roles: ['Farmer'],
    },
    {
      id: 4,
      username: 'distributor',
      email: 'distributor@bauang.local',
      password: 'ChangeMe123!',
      is_active: true,
      date_joined: dateTimeOffset(-85),
      roles: ['Distributor'],
    },
    {
      id: 5,
      username: 'farmer_ana',
      email: 'farmer.ana@bauang.local',
      password: 'ChangeMe123!',
      is_active: true,
      date_joined: dateTimeOffset(-80),
      roles: ['Farmer'],
    },
    {
      id: 6,
      username: 'farmer_ben',
      email: 'farmer.ben@bauang.local',
      password: 'ChangeMe123!',
      is_active: true,
      date_joined: dateTimeOffset(-78),
      roles: ['Farmer'],
    },
    {
      id: 7,
      username: 'farmer_carla',
      email: 'farmer.carla@bauang.local',
      password: 'ChangeMe123!',
      is_active: true,
      date_joined: dateTimeOffset(-76),
      roles: ['Farmer'],
    },
    {
      id: 8,
      username: 'farmer_diego',
      email: 'farmer.diego@bauang.local',
      password: 'ChangeMe123!',
      is_active: true,
      date_joined: dateTimeOffset(-74),
      roles: ['Farmer'],
    },
    {
      id: 9,
      username: 'farmer_elena',
      email: 'farmer.elena@bauang.local',
      password: 'ChangeMe123!',
      is_active: true,
      date_joined: dateTimeOffset(-72),
      roles: ['Farmer'],
    },
    {
      id: 10,
      username: 'distributor_alt',
      email: 'distributor.alt@bauang.local',
      password: 'ChangeMe123!',
      is_active: true,
      date_joined: dateTimeOffset(-70),
      roles: ['Distributor'],
    },
    {
      id: 11,
      username: 'demo_guest',
      email: 'demo.guest@bauang.local',
      password: 'ChangeMe123!',
      is_active: true,
      date_joined: dateTimeOffset(-68),
      roles: [],
    },
  ]

  const programs = [
    {
      id: 1,
      name: 'Rice Support 2026',
      description:
        'Rice productivity support with seed and nutrient intervention packs.',
      start_date: dateOffset(-15),
      end_date: dateOffset(120),
      is_archived: false,
      created_at: dateTimeOffset(-30),
      updated_at: now,
    },
    {
      id: 2,
      name: 'Vegetable Recovery 2026',
      description:
        'Vegetable rehabilitation initiative for climate-affected barangays.',
      start_date: dateOffset(-30),
      end_date: dateOffset(35),
      is_archived: false,
      created_at: dateTimeOffset(-29),
      updated_at: now,
    },
    {
      id: 3,
      name: 'Legacy Corn Assistance 2025',
      description: 'Archived historical program retained for reporting demo purposes.',
      start_date: dateOffset(-420),
      end_date: dateOffset(-180),
      is_archived: true,
      created_at: dateTimeOffset(-400),
      updated_at: now,
    },
  ]

  const interventions = [
    {
      id: 1,
      program: 1,
      name: 'Rice Seed Pack A',
      description: 'Starter package for wet season rice cultivation.',
      start_date: dateOffset(-14),
      end_date: dateOffset(90),
      is_archived: false,
      created_at: dateTimeOffset(-28),
      updated_at: now,
    },
    {
      id: 2,
      program: 1,
      name: 'Rice Fertilizer Booster',
      description: 'Top-dress nutrient support for tillering and grain filling stage.',
      start_date: dateOffset(-10),
      end_date: dateOffset(75),
      is_archived: false,
      created_at: dateTimeOffset(-27),
      updated_at: now,
    },
    {
      id: 3,
      program: 2,
      name: 'Vegetable Starter Kit',
      description: 'Rapid deployment of vegetable seeds and trays for early planting.',
      start_date: dateOffset(-25),
      end_date: dateOffset(30),
      is_archived: false,
      created_at: dateTimeOffset(-26),
      updated_at: now,
    },
    {
      id: 4,
      program: 2,
      name: 'Bio Nutrient Booster',
      description: 'Bio-input support for nutrient recovery and resilience.',
      start_date: dateOffset(-20),
      end_date: dateOffset(25),
      is_archived: false,
      created_at: dateTimeOffset(-25),
      updated_at: now,
    },
    {
      id: 5,
      program: 3,
      name: 'Legacy Corn Pack',
      description: 'Archived intervention kept for historical reporting flows.',
      start_date: dateOffset(-400),
      end_date: dateOffset(-200),
      is_archived: true,
      created_at: dateTimeOffset(-399),
      updated_at: now,
    },
  ]

  const distributors = [
    {
      id: 1,
      user: 4,
      name: 'Bauang North Logistics',
      location: 'Bauang, La Union',
      services_offered: 'Last-mile distribution and delivery status updates',
      accreditation_status: 'Accredited',
      contact_person: 'Route Supervisor',
      contact_number: '09170001111',
      created_at: dateTimeOffset(-45),
    },
    {
      id: 2,
      user: 10,
      name: 'Bauang East Routes',
      location: 'Bauang East Cluster',
      services_offered: 'Backup route fulfillment and rural drop coordination',
      accreditation_status: 'Accredited',
      contact_person: 'Field Coordinator',
      contact_number: '09170002222',
      created_at: dateTimeOffset(-44),
    },
    {
      id: 3,
      user: null,
      name: 'La Union Agri Movers',
      location: 'San Fernando, La Union',
      services_offered: 'Inter-municipality inventory transfer support',
      accreditation_status: 'Pending',
      contact_person: 'Regional Liaison',
      contact_number: '09170003333',
      created_at: dateTimeOffset(-43),
    },
  ]

  const farmerProfiles = [
    {
      id: 1,
      user: 3,
      first_name: 'Demo',
      last_name: 'Farmer',
      address: 'Poblacion, Bauang, La Union',
      contact_number: '09171234567',
      credentials_status: 'Pending',
      farm_location: 'Barangay Poblacion Block 4',
      planting_season: 'Wet Season',
      date_registered: dateTimeOffset(-65),
    },
    {
      id: 2,
      user: 5,
      first_name: 'Ana',
      last_name: 'Valdez',
      address: 'Barangay Nagrebcan, Bauang, La Union',
      contact_number: '09171110001',
      credentials_status: 'Verified',
      farm_location: 'Sitio Eastfield Lot 2',
      planting_season: 'Dry Season',
      date_registered: dateTimeOffset(-64),
    },
    {
      id: 3,
      user: 6,
      first_name: 'Ben',
      last_name: 'Mendoza',
      address: 'Barangay Acao, Bauang, La Union',
      contact_number: '09171110002',
      credentials_status: 'Pending',
      farm_location: 'Acao Riverside Plot 7',
      planting_season: 'Wet Season',
      date_registered: dateTimeOffset(-63),
    },
    {
      id: 4,
      user: 7,
      first_name: 'Carla',
      last_name: 'Santos',
      address: 'Barangay Payocpoc Norte, Bauang, La Union',
      contact_number: '09171110003',
      credentials_status: 'Verified',
      farm_location: 'Payocpoc Highland Terrace',
      planting_season: 'Wet Season',
      date_registered: dateTimeOffset(-62),
    },
    {
      id: 5,
      user: 8,
      first_name: 'Diego',
      last_name: 'Agustin',
      address: 'Barangay Baccuit Norte, Bauang, La Union',
      contact_number: '09171110004',
      credentials_status: 'Rejected',
      farm_location: 'Baccuit North Zone 3',
      planting_season: 'Dry Season',
      date_registered: dateTimeOffset(-61),
    },
    {
      id: 6,
      user: 9,
      first_name: 'Elena',
      last_name: 'Garcia',
      address: 'Barangay Santiago, Bauang, La Union',
      contact_number: '09171110005',
      credentials_status: 'Pending',
      farm_location: 'Santiago Coastal Farm 5',
      planting_season: 'Wet Season',
      date_registered: dateTimeOffset(-60),
    },
  ]

  const applications = [
    {
      id: 1,
      farmer: 1,
      intervention: 1,
      application_date: dateTimeOffset(-18),
      status: 'Pending',
      remarks: 'Awaiting staff review for first-cycle support.',
    },
    {
      id: 2,
      farmer: 1,
      intervention: 2,
      application_date: dateTimeOffset(-17),
      status: 'Approved',
      remarks: 'Approved for nutrient top-up support.',
    },
    {
      id: 3,
      farmer: 2,
      intervention: 1,
      application_date: dateTimeOffset(-16),
      status: 'Approved',
      remarks: 'Verified profile and approved for release planning.',
    },
    {
      id: 4,
      farmer: 3,
      intervention: 2,
      application_date: dateTimeOffset(-15),
      status: 'Approved',
      remarks: 'Approved pending assignment and release.',
    },
    {
      id: 5,
      farmer: 4,
      intervention: 3,
      application_date: dateTimeOffset(-14),
      status: 'Rejected',
      remarks: 'Needs updated farm registry document for renewal.',
    },
    {
      id: 6,
      farmer: 5,
      intervention: 3,
      application_date: dateTimeOffset(-13),
      status: 'Pending',
      remarks: 'Pending profile update and re-verification workflow.',
    },
    {
      id: 7,
      farmer: 6,
      intervention: 4,
      application_date: dateTimeOffset(-12),
      status: 'Approved',
      remarks: 'Approved for priority nutrient delivery route.',
    },
  ]

  const inventoryCatalog = [
    {
      id: 1,
      name: 'Certified Rice Seeds RC222',
      item_group: 'rice',
      unit_of_measure: 'bag',
      low_stock_threshold: 20,
      is_active: true,
      created_at: dateTimeOffset(-40),
      updated_at: now,
    },
    {
      id: 2,
      name: 'Complete Fertilizer 14-14-14',
      item_group: 'other',
      unit_of_measure: 'sack',
      low_stock_threshold: 15,
      is_active: true,
      created_at: dateTimeOffset(-39),
      updated_at: now,
    },
    {
      id: 3,
      name: 'Vegetable Seedling Trays',
      item_group: 'vegetable',
      unit_of_measure: 'tray',
      low_stock_threshold: 12,
      is_active: true,
      created_at: dateTimeOffset(-38),
      updated_at: now,
    },
    {
      id: 4,
      name: 'Bio Pesticide Concentrate',
      item_group: 'other',
      unit_of_measure: 'liter',
      low_stock_threshold: 5,
      is_active: true,
      created_at: dateTimeOffset(-37),
      updated_at: now,
    },
  ]

  const inventory = [
    {
      id: 1,
      item_catalog: 1,
      intervention: 1,
      input_name: 'Rice Seed Pack A',
      quantity_received: 60,
      quantity_available: 37,
      distributor: 1,
      delivery_date: dateOffset(-6),
      expiry_date: dateOffset(180),
      last_updated: now,
    },
    {
      id: 2,
      item_catalog: 2,
      intervention: 2,
      input_name: 'Rice Fertilizer Booster Batch 1',
      quantity_received: 22,
      quantity_available: 12,
      distributor: 1,
      delivery_date: dateOffset(-8),
      expiry_date: dateOffset(70),
      last_updated: now,
    },
    {
      id: 3,
      item_catalog: 3,
      intervention: 3,
      input_name: 'Vegetable Starter Kit Batch 1',
      quantity_received: 40,
      quantity_available: 0,
      distributor: 2,
      delivery_date: dateOffset(-9),
      expiry_date: dateOffset(14),
      last_updated: now,
    },
    {
      id: 4,
      item_catalog: 4,
      intervention: 4,
      input_name: 'Bio Nutrient Booster Pack',
      quantity_received: 8,
      quantity_available: 3,
      distributor: 1,
      delivery_date: dateOffset(-5),
      expiry_date: dateOffset(10),
      last_updated: now,
    },
  ]

  const distributions = [
    {
      id: 1,
      farmer: 2,
      input_inventory: 1,
      quantity_released: 20,
      assigned_distributor: 1,
      distribution_date: dateTimeOffset(-10),
      release_officer: null,
      status: 'Pending',
      remarks: 'Queued for release scheduling. [demo-seed:D001]',
    },
    {
      id: 2,
      farmer: 3,
      input_inventory: 2,
      quantity_released: 10,
      assigned_distributor: 1,
      distribution_date: dateTimeOffset(-9),
      release_officer: 2,
      status: 'Released',
      remarks: 'Released and ready for route dispatch. [demo-seed:D002]',
    },
    {
      id: 3,
      farmer: 1,
      input_inventory: 1,
      quantity_released: 15,
      assigned_distributor: 1,
      distribution_date: dateTimeOffset(-8),
      release_officer: 2,
      status: 'Delivered',
      remarks: 'Delivered with confirmation from distributor. [demo-seed:D003]',
    },
    {
      id: 4,
      farmer: 6,
      input_inventory: 4,
      quantity_released: 5,
      assigned_distributor: 1,
      distribution_date: dateTimeOffset(-7),
      release_officer: 2,
      status: 'Delayed',
      remarks: 'Route delayed due to weather conditions. [demo-seed:D004]',
    },
    {
      id: 5,
      farmer: 3,
      input_inventory: 1,
      quantity_released: 8,
      assigned_distributor: 1,
      distribution_date: dateTimeOffset(-6),
      release_officer: 2,
      status: 'Rescheduled',
      remarks: 'Rescheduled for next distribution window. [demo-seed:D005]',
    },
    {
      id: 6,
      farmer: 5,
      input_inventory: 2,
      quantity_released: 4,
      assigned_distributor: 2,
      distribution_date: dateTimeOffset(-5),
      release_officer: null,
      status: 'Cancelled',
      remarks: 'Cancelled due to incomplete profile compliance. [demo-seed:D006]',
    },
    {
      id: 7,
      farmer: 4,
      input_inventory: 3,
      quantity_released: 40,
      assigned_distributor: 2,
      distribution_date: dateTimeOffset(-4),
      release_officer: 2,
      status: 'Delivered',
      remarks: 'Full batch delivered to close out stock item. [demo-seed:D007]',
    },
  ]

  const distributionStatusLogs = [
    {
      id: 1,
      distribution: 1,
      previous_status: '',
      new_status: 'Pending',
      remarks: 'Distribution assignment created [demo-log:D001:1]',
      updated_by: 2,
      created_at: dateTimeOffset(-10),
    },
    {
      id: 2,
      distribution: 2,
      previous_status: '',
      new_status: 'Pending',
      remarks: 'Distribution assignment created [demo-log:D002:1]',
      updated_by: 2,
      created_at: dateTimeOffset(-9),
    },
    {
      id: 3,
      distribution: 2,
      previous_status: 'Pending',
      new_status: 'Released',
      remarks: 'Distribution released for delivery [demo-log:D002:2]',
      updated_by: 2,
      created_at: dateTimeOffset(-9),
    },
    {
      id: 4,
      distribution: 3,
      previous_status: '',
      new_status: 'Pending',
      remarks: 'Distribution assignment created [demo-log:D003:1]',
      updated_by: 2,
      created_at: dateTimeOffset(-8),
    },
    {
      id: 5,
      distribution: 3,
      previous_status: 'Pending',
      new_status: 'Released',
      remarks: 'Distribution released for delivery [demo-log:D003:2]',
      updated_by: 2,
      created_at: dateTimeOffset(-8),
    },
    {
      id: 6,
      distribution: 3,
      previous_status: 'Released',
      new_status: 'Delivered',
      remarks: 'Delivery confirmed by distributor [demo-log:D003:3]',
      updated_by: 4,
      created_at: dateTimeOffset(-8),
    },
    {
      id: 7,
      distribution: 4,
      previous_status: '',
      new_status: 'Pending',
      remarks: 'Distribution assignment created [demo-log:D004:1]',
      updated_by: 2,
      created_at: dateTimeOffset(-7),
    },
    {
      id: 8,
      distribution: 4,
      previous_status: 'Pending',
      new_status: 'Released',
      remarks: 'Distribution released for delivery [demo-log:D004:2]',
      updated_by: 2,
      created_at: dateTimeOffset(-7),
    },
    {
      id: 9,
      distribution: 4,
      previous_status: 'Released',
      new_status: 'Delayed',
      remarks: 'Delivery marked delayed by distributor [demo-log:D004:3]',
      updated_by: 4,
      created_at: dateTimeOffset(-7),
    },
    {
      id: 10,
      distribution: 5,
      previous_status: '',
      new_status: 'Pending',
      remarks: 'Distribution assignment created [demo-log:D005:1]',
      updated_by: 2,
      created_at: dateTimeOffset(-6),
    },
    {
      id: 11,
      distribution: 5,
      previous_status: 'Pending',
      new_status: 'Released',
      remarks: 'Distribution released for delivery [demo-log:D005:2]',
      updated_by: 2,
      created_at: dateTimeOffset(-6),
    },
    {
      id: 12,
      distribution: 5,
      previous_status: 'Released',
      new_status: 'Rescheduled',
      remarks: 'Delivery rescheduled by distributor [demo-log:D005:3]',
      updated_by: 4,
      created_at: dateTimeOffset(-6),
    },
    {
      id: 13,
      distribution: 6,
      previous_status: '',
      new_status: 'Pending',
      remarks: 'Distribution assignment created [demo-log:D006:1]',
      updated_by: 2,
      created_at: dateTimeOffset(-5),
    },
    {
      id: 14,
      distribution: 6,
      previous_status: 'Pending',
      new_status: 'Cancelled',
      remarks: 'Distribution cancelled by staff [demo-log:D006:2]',
      updated_by: 2,
      created_at: dateTimeOffset(-5),
    },
    {
      id: 15,
      distribution: 7,
      previous_status: '',
      new_status: 'Pending',
      remarks: 'Distribution assignment created [demo-log:D007:1]',
      updated_by: 2,
      created_at: dateTimeOffset(-4),
    },
    {
      id: 16,
      distribution: 7,
      previous_status: 'Pending',
      new_status: 'Released',
      remarks: 'Distribution released for delivery [demo-log:D007:2]',
      updated_by: 2,
      created_at: dateTimeOffset(-4),
    },
    {
      id: 17,
      distribution: 7,
      previous_status: 'Released',
      new_status: 'Delivered',
      remarks: 'Delivery confirmed by distributor [demo-log:D007:3]',
      updated_by: 10,
      created_at: dateTimeOffset(-4),
    },
  ]

  const inventoryTransactions = [
    {
      id: 1,
      inventory: 1,
      transaction_type: 'received',
      quantity: 60,
      reference: 'demo-seed:received:inv_rice_seed',
      created_at: dateTimeOffset(-6),
    },
    {
      id: 2,
      inventory: 2,
      transaction_type: 'received',
      quantity: 22,
      reference: 'demo-seed:received:inv_fertilizer',
      created_at: dateTimeOffset(-8),
    },
    {
      id: 3,
      inventory: 3,
      transaction_type: 'received',
      quantity: 40,
      reference: 'demo-seed:received:inv_vegetable_seedlings',
      created_at: dateTimeOffset(-9),
    },
    {
      id: 4,
      inventory: 4,
      transaction_type: 'received',
      quantity: 8,
      reference: 'demo-seed:received:inv_bio_pesticide',
      created_at: dateTimeOffset(-5),
    },
    {
      id: 5,
      inventory: 2,
      transaction_type: 'allocated',
      quantity: 10,
      reference: 'demo-seed:distribution:D002',
      created_at: dateTimeOffset(-9),
    },
    {
      id: 6,
      inventory: 1,
      transaction_type: 'allocated',
      quantity: 15,
      reference: 'demo-seed:distribution:D003',
      created_at: dateTimeOffset(-8),
    },
    {
      id: 7,
      inventory: 4,
      transaction_type: 'allocated',
      quantity: 5,
      reference: 'demo-seed:distribution:D004',
      created_at: dateTimeOffset(-7),
    },
    {
      id: 8,
      inventory: 1,
      transaction_type: 'allocated',
      quantity: 8,
      reference: 'demo-seed:distribution:D005',
      created_at: dateTimeOffset(-6),
    },
    {
      id: 9,
      inventory: 3,
      transaction_type: 'allocated',
      quantity: 40,
      reference: 'demo-seed:distribution:D007',
      created_at: dateTimeOffset(-4),
    },
  ]

  return {
    meta: {
      version: DEMO_DB_VERSION,
      nextIds: {
        users: 12,
        farmers: 7,
        applications: 8,
        programs: 4,
        interventions: 6,
        distributors: 4,
        inventoryCatalog: 5,
        inventory: 5,
        distributions: 8,
        distributionStatusLogs: 18,
        inventoryTransactions: 10,
      },
    },
    roles,
    users,
    farmerProfiles,
    applications,
    programs,
    interventions,
    distributors,
    inventoryCatalog,
    inventory,
    distributions,
    distributionStatusLogs,
    inventoryTransactions,
  }
}

function nextId(db, key) {
  const current = Number(db.meta.nextIds[key] || 1)
  db.meta.nextIds[key] = current + 1
  return current
}

function ensureAuthUser(db, request) {
  const explicitHeader = request.config?.headers?.Authorization
  const session = readAuthSession()
  const sessionHeader = session?.accessToken ? `Bearer ${session.accessToken}` : null
  const authHeader = explicitHeader || sessionHeader

  if (!authHeader || !String(authHeader).startsWith('Bearer ')) {
    throwError(401, { detail: 'Authentication credentials were not provided.' }, request)
  }

  const token = String(authHeader).slice('Bearer '.length).trim()
  const userId = parseAccessToken(token)

  if (!userId) {
    throwError(401, { detail: 'Invalid token.' }, request)
  }

  const user = db.users.find((item) => item.id === userId)
  if (!user || !user.is_active) {
    throwError(401, { detail: 'User not found or inactive.' }, request)
  }

  return user
}

function requireRoles(user, allowedRoles, request) {
  const hasRole = user.roles.some((roleName) => allowedRoles.includes(roleName))

  if (!hasRole) {
    throwError(403, { detail: 'You do not have permission to perform this action.' }, request)
  }
}

function serializeUser(db, user) {
  const hasFarmerProfile = db.farmerProfiles.some((item) => item.user === user.id)

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    is_active: user.is_active,
    date_joined: user.date_joined,
    roles: [...user.roles],
    has_farmer_profile: hasFarmerProfile,
  }
}

function serializeFarmerProfile(profile) {
  return {
    id: profile.id,
    user: profile.user,
    first_name: profile.first_name,
    last_name: profile.last_name,
    address: profile.address,
    contact_number: profile.contact_number,
    credentials_status: profile.credentials_status,
    farm_location: profile.farm_location,
    planting_season: profile.planting_season,
    date_registered: profile.date_registered,
  }
}

function serializeApplication(app) {
  return {
    id: app.id,
    farmer: app.farmer,
    intervention: app.intervention,
    application_date: app.application_date,
    status: app.status,
    remarks: app.remarks || '',
  }
}

function serializeProgram(program) {
  return {
    id: program.id,
    name: program.name,
    description: program.description || '',
    start_date: program.start_date,
    end_date: program.end_date,
    is_archived: Boolean(program.is_archived),
    created_at: program.created_at,
    updated_at: program.updated_at,
  }
}

function serializeIntervention(intervention) {
  return {
    id: intervention.id,
    program: intervention.program,
    name: intervention.name,
    description: intervention.description || '',
    start_date: intervention.start_date,
    end_date: intervention.end_date,
    is_archived: Boolean(intervention.is_archived),
    created_at: intervention.created_at,
    updated_at: intervention.updated_at,
  }
}

function serializeCatalogItem(item) {
  return {
    id: item.id,
    name: item.name,
    item_group: item.item_group,
    unit_of_measure: item.unit_of_measure,
    low_stock_threshold: Number(item.low_stock_threshold || 0),
    is_active: Boolean(item.is_active),
    created_at: item.created_at,
    updated_at: item.updated_at,
  }
}

function serializeInventoryItem(db, item) {
  const catalogItem = db.inventoryCatalog.find((entry) => entry.id === item.item_catalog) || null

  return {
    id: item.id,
    item_catalog: item.item_catalog,
    item_catalog_name: catalogItem?.name || null,
    item_group: catalogItem?.item_group || 'other',
    unit_of_measure: catalogItem?.unit_of_measure || '',
    low_stock_threshold: Number(catalogItem?.low_stock_threshold ?? 10),
    intervention: item.intervention,
    input_name: item.input_name,
    quantity_received: Number(item.quantity_received || 0),
    quantity_available: Number(item.quantity_available || 0),
    distributor: item.distributor,
    delivery_date: item.delivery_date,
    expiry_date: item.expiry_date,
    last_updated: item.last_updated,
  }
}

function serializeDistributor(distributor) {
  return {
    id: distributor.id,
    user: distributor.user,
    name: distributor.name,
    location: distributor.location,
    services_offered: distributor.services_offered,
    accreditation_status: distributor.accreditation_status,
    contact_person: distributor.contact_person,
    contact_number: distributor.contact_number,
    created_at: distributor.created_at,
  }
}

function serializeDistribution(db, distribution) {
  const farmer = db.farmerProfiles.find((item) => item.id === distribution.farmer)
  const inventoryItem = db.inventory.find((item) => item.id === distribution.input_inventory)
  const distributor = db.distributors.find((item) => item.id === distribution.assigned_distributor)

  return {
    id: distribution.id,
    farmer: distribution.farmer,
    farmer_name: farmer ? `${farmer.last_name}, ${farmer.first_name}` : '',
    input_inventory: distribution.input_inventory,
    input_name: inventoryItem?.input_name || '',
    quantity_released: Number(distribution.quantity_released || 0),
    assigned_distributor: distribution.assigned_distributor,
    assigned_distributor_name: distributor?.name || '',
    distribution_date: distribution.distribution_date,
    release_officer: distribution.release_officer,
    status: distribution.status,
    remarks: distribution.remarks || '',
  }
}

function serializeDistributionStatusLog(db, log) {
  const updatedBy = db.users.find((item) => item.id === log.updated_by)

  return {
    id: log.id,
    distribution: log.distribution,
    previous_status: log.previous_status || '',
    new_status: log.new_status,
    remarks: log.remarks || '',
    updated_by: log.updated_by,
    updated_by_username: updatedBy?.username || '',
    created_at: log.created_at,
  }
}

function findFarmerProfileByUser(db, userId) {
  return db.farmerProfiles.find((item) => item.user === userId) || null
}

function findDistributorByUser(db, userId) {
  return db.distributors.find((item) => item.user === userId) || null
}

function createDistributionLog(db, distributionId, previousStatus, nextStatus, remarks, actorId) {
  const log = {
    id: nextId(db, 'distributionStatusLogs'),
    distribution: distributionId,
    previous_status: previousStatus || '',
    new_status: nextStatus,
    remarks: remarks || '',
    updated_by: actorId || null,
    created_at: new Date().toISOString(),
  }

  db.distributionStatusLogs.push(log)
}

function createInventoryTransaction(db, payload) {
  db.inventoryTransactions.push({
    id: nextId(db, 'inventoryTransactions'),
    inventory: payload.inventory,
    transaction_type: payload.transaction_type,
    quantity: Number(payload.quantity || 0),
    reference: payload.reference || '',
    created_at: new Date().toISOString(),
  })
}

function getInventoryAlerts(db, sourceItems) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const rows = []

  sourceItems.forEach((item) => {
    const catalogItem = db.inventoryCatalog.find((entry) => entry.id === item.item_catalog)
    const threshold = Number(catalogItem?.low_stock_threshold ?? 10)
    const available = Number(item.quantity_available || 0)
    const outOfStock = available <= 0
    const lowStock = !outOfStock && available <= threshold

    let daysUntilExpiry = null
    let expiringSoon = false

    if (item.expiry_date) {
      const expiry = new Date(`${item.expiry_date}T00:00:00`)
      daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
      expiringSoon = daysUntilExpiry <= 30
    }

    const reasons = []
    let severity = 'none'

    if (outOfStock) {
      reasons.push('Out of stock')
      severity = 'critical'
    } else if (lowStock) {
      reasons.push('Low stock')
      severity = 'warning'
    }

    if (expiringSoon) {
      reasons.push('Expiring soon')
      if (severity === 'none') severity = 'warning'
    }

    if (reasons.length === 0) {
      return
    }

    rows.push({
      inventory_id: item.id,
      item_name: catalogItem?.name || item.input_name,
      item_group: catalogItem?.item_group || 'other',
      unit_of_measure: catalogItem?.unit_of_measure || '',
      available_quantity: available,
      low_stock_threshold: threshold,
      expiry_date: item.expiry_date,
      days_until_expiry: daysUntilExpiry,
      intervention: item.intervention,
      reasons,
      severity,
    })
  })

  const severityRank = {
    critical: 0,
    warning: 1,
    none: 2,
  }

  rows.sort((left, right) => {
    const rankDiff = severityRank[left.severity] - severityRank[right.severity]
    if (rankDiff !== 0) return rankDiff

    const leftExpiry = left.days_until_expiry == null ? Number.MAX_SAFE_INTEGER : left.days_until_expiry
    const rightExpiry = right.days_until_expiry == null ? Number.MAX_SAFE_INTEGER : right.days_until_expiry

    if (leftExpiry !== rightExpiry) return leftExpiry - rightExpiry

    return String(left.item_name).localeCompare(String(right.item_name))
  })

  return {
    summary: {
      critical: rows.filter((item) => item.severity === 'critical').length,
      warning: rows.filter((item) => item.severity === 'warning').length,
      total_alerts: rows.length,
    },
    alerts: rows,
  }
}

function applyProgramValidation(db, programPayload, currentProgram, request) {
  const startDate = programPayload.start_date ?? currentProgram?.start_date
  const endDate = programPayload.end_date ?? currentProgram?.end_date

  if (startDate && endDate && startDate > endDate) {
    throwError(400, { end_date: ['End date must be on or after start date.'] }, request)
  }

  if (programPayload.name) {
    const duplicate = db.programs.find(
      (item) =>
        item.name.toLowerCase() === String(programPayload.name).trim().toLowerCase() &&
        item.id !== currentProgram?.id,
    )

    if (duplicate) {
      throwError(400, { name: ['Program with this name already exists.'] }, request)
    }
  }
}

function applyInterventionValidation(db, payload, currentIntervention, request) {
  const targetProgramId = Number(payload.program ?? currentIntervention?.program)
  const targetProgram = db.programs.find((item) => item.id === targetProgramId)

  if (!targetProgram) {
    throwError(400, { program: ['Program is required.'] }, request)
  }

  if (targetProgram.is_archived) {
    throwError(400, { program: ['Cannot assign intervention to an archived program.'] }, request)
  }

  const startDate = payload.start_date ?? currentIntervention?.start_date
  const endDate = payload.end_date ?? currentIntervention?.end_date

  if (startDate && endDate && startDate > endDate) {
    throwError(400, { end_date: ['End date must be on or after start date.'] }, request)
  }

  if (startDate && startDate < targetProgram.start_date) {
    throwError(400, {
      start_date: ['Intervention start date cannot be earlier than program start date.'],
    }, request)
  }

  if (endDate && endDate > targetProgram.end_date) {
    throwError(400, {
      end_date: ['Intervention end date cannot be later than program end date.'],
    }, request)
  }

  if (payload.name) {
    const duplicate = db.interventions.find(
      (item) =>
        item.program === targetProgramId &&
        item.name.toLowerCase() === String(payload.name).trim().toLowerCase() &&
        item.id !== currentIntervention?.id,
    )

    if (duplicate) {
      throwError(400, { name: ['Intervention with this name already exists.'] }, request)
    }
  }

  return targetProgramId
}

function routeRequest(db, request) {
  const method = request.method.toLowerCase()
  const path = normalizePath(request.url)
  const segments = path ? path.split('/') : []

  if (method === 'post' && path === 'auth/login') {
    const username = String(request.data?.username || '').trim()
    const password = String(request.data?.password || '')

    const user = db.users.find((item) => item.username === username)

    if (!user || user.password !== password) {
      throwError(401, { detail: 'No active account found with the given credentials' }, request)
    }

    if (!user.is_active) {
      throwError(401, { detail: 'This account is inactive.' }, request)
    }

    if (!user.roles || user.roles.length === 0) {
      throwError(403, { detail: 'This account has no assigned role. Contact an administrator.' }, request)
    }

    return {
      status: 200,
      data: {
        access: makeAccessToken(user.id),
        refresh: makeRefreshToken(user.id),
      },
    }
  }

  if (method === 'post' && path === 'auth/refresh') {
    const refreshToken = String(request.data?.refresh || '')
    const userId = parseAccessToken(refreshToken)
    const user = db.users.find((item) => item.id === userId)

    if (!user) {
      throwError(401, { detail: 'Token is invalid or expired' }, request)
    }

    return {
      status: 200,
      data: {
        access: makeAccessToken(user.id),
        refresh: makeRefreshToken(user.id),
      },
    }
  }

  const authUser = ensureAuthUser(db, request)

  if (method === 'get' && path === 'auth/me') {
    return {
      status: 200,
      data: serializeUser(db, authUser),
    }
  }

  if (method === 'get' && path === 'roles') {
    requireRoles(authUser, ['Admin', 'Staff'], request)

    return {
      status: 200,
      data: db.roles
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((item) => ({ id: item.id, name: item.name })),
    }
  }

  if (segments[0] === 'users') {
    if (segments.length === 1 && method === 'get') {
      requireRoles(authUser, ['Admin', 'Staff'], request)

      const rows = db.users
        .slice()
        .sort((left, right) => new Date(right.date_joined) - new Date(left.date_joined))
        .map((item) => serializeUser(db, item))

      return { status: 200, data: rows }
    }

    if (segments.length === 1 && method === 'post') {
      requireRoles(authUser, ['Admin'], request)

      const username = String(request.data?.username || '').trim()
      const email = String(request.data?.email || '').trim()
      const password = String(request.data?.password || '')
      const roleId = Number(request.data?.role_id)
      const isActive = request.data?.is_active ?? true

      if (!username) {
        throwError(400, { username: ['This field is required.'] }, request)
      }

      if (!password || password.length < 8) {
        throwError(400, { password: ['Ensure this field has at least 8 characters.'] }, request)
      }

      const role = db.roles.find((item) => item.id === roleId)
      if (!role) {
        throwError(400, { role_id: ['Invalid role id.'] }, request)
      }

      const duplicateUsername = db.users.find(
        (item) => item.username.toLowerCase() === username.toLowerCase(),
      )

      if (duplicateUsername) {
        throwError(400, { username: ['A user with that username already exists.'] }, request)
      }

      if (email) {
        const duplicateEmail = db.users.find(
          (item) => item.email && item.email.toLowerCase() === email.toLowerCase(),
        )

        if (duplicateEmail) {
          throwError(400, { email: ['A user with that email already exists.'] }, request)
        }
      }

      const user = {
        id: nextId(db, 'users'),
        username,
        email,
        password,
        is_active: Boolean(isActive),
        date_joined: new Date().toISOString(),
        roles: [role.name],
      }

      db.users.push(user)
      saveDb(db)

      return {
        status: 201,
        data: serializeUser(db, user),
      }
    }

    if (segments.length >= 2) {
      const userId = Number(segments[1])
      const targetUser = db.users.find((item) => item.id === userId)

      if (!targetUser) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      if (segments.length === 2 && method === 'patch') {
        requireRoles(authUser, ['Admin', 'Staff'], request)

        if (request.data?.username != null) {
          const username = String(request.data.username).trim()
          if (!username) {
            throwError(400, { username: ['This field may not be blank.'] }, request)
          }

          const duplicate = db.users.find(
            (item) =>
              item.id !== targetUser.id &&
              item.username.toLowerCase() === username.toLowerCase(),
          )

          if (duplicate) {
            throwError(400, { username: ['A user with that username already exists.'] }, request)
          }

          targetUser.username = username
        }

        if (request.data?.email != null) {
          const email = String(request.data.email).trim()
          if (email) {
            const duplicate = db.users.find(
              (item) => item.id !== targetUser.id && item.email?.toLowerCase() === email.toLowerCase(),
            )

            if (duplicate) {
              throwError(400, { email: ['A user with that email already exists.'] }, request)
            }
          }

          targetUser.email = email
        }

        if (request.data?.is_active != null) {
          targetUser.is_active = Boolean(request.data.is_active)
        }

        saveDb(db)

        return {
          status: 200,
          data: serializeUser(db, targetUser),
        }
      }

      if (segments[2] === 'assign_role' && method === 'post') {
        requireRoles(authUser, ['Admin'], request)

        const roleId = Number(request.data?.role_id)
        const role = db.roles.find((item) => item.id === roleId)

        if (!role) {
          throwError(400, { role_id: ['Invalid role id.'] }, request)
        }

        if (!targetUser.roles.includes(role.name)) {
          targetUser.roles.push(role.name)
        }

        saveDb(db)

        return {
          status: 200,
          data: serializeUser(db, targetUser),
        }
      }

      if (segments[2] === 'remove_role' && method === 'post') {
        requireRoles(authUser, ['Admin'], request)

        const roleId = Number(request.data?.role_id)
        const role = db.roles.find((item) => item.id === roleId)

        if (!role || !targetUser.roles.includes(role.name)) {
          throwError(400, { detail: 'This user is not assigned to the selected role.' }, request)
        }

        if (targetUser.is_active && targetUser.roles.length <= 1) {
          throwError(400, {
            detail:
              'Cannot remove the last role from an active user. Assign another role or deactivate the account first.',
          }, request)
        }

        targetUser.roles = targetUser.roles.filter((roleName) => roleName !== role.name)
        saveDb(db)

        return {
          status: 200,
          data: serializeUser(db, targetUser),
        }
      }

      if (segments[2] === 'reset_password' && method === 'post') {
        requireRoles(authUser, ['Admin'], request)

        const nextPassword = String(request.data?.new_password || '')

        if (nextPassword.length < 8) {
          throwError(400, { new_password: ['Ensure this field has at least 8 characters.'] }, request)
        }

        targetUser.password = nextPassword
        saveDb(db)

        return {
          status: 200,
          data: { detail: 'Password reset successful.' },
        }
      }
    }
  }

  if (segments[0] === 'farmers') {
    if (segments.length === 1 && method === 'get') {
      let rows = db.farmerProfiles.slice()

      if (authUser.roles.includes('Farmer')) {
        rows = rows.filter((item) => item.user === authUser.id)
      } else if (
        !authUser.roles.includes('Admin') &&
        !authUser.roles.includes('Staff')
      ) {
        rows = []
      }

      rows.sort((left, right) => {
        const nameCompare = left.last_name.localeCompare(right.last_name)
        if (nameCompare !== 0) return nameCompare
        return left.first_name.localeCompare(right.first_name)
      })

      return {
        status: 200,
        data: rows.map((item) => serializeFarmerProfile(item)),
      }
    }

    if (segments.length === 1 && method === 'post') {
      requireRoles(authUser, ['Admin', 'Staff'], request)

      const payload = request.data || {}
      const userId = Number(payload.user)

      const linkedUser = db.users.find((item) => item.id === userId)
      if (!linkedUser) {
        throwError(400, { user: ['Invalid user id.'] }, request)
      }

      const existing = db.farmerProfiles.find((item) => item.user === userId)
      if (existing) {
        throwError(400, { user: ['Farmer profile already exists for this user.'] }, request)
      }

      const requiredFields = [
        'first_name',
        'last_name',
        'address',
        'contact_number',
        'farm_location',
        'planting_season',
      ]

      requiredFields.forEach((field) => {
        if (!String(payload[field] || '').trim()) {
          throwError(400, { [field]: ['This field is required.'] }, request)
        }
      })

      const profile = {
        id: nextId(db, 'farmers'),
        user: userId,
        first_name: String(payload.first_name).trim(),
        last_name: String(payload.last_name).trim(),
        address: String(payload.address).trim(),
        contact_number: String(payload.contact_number).trim(),
        credentials_status: payload.credentials_status || 'Pending',
        farm_location: String(payload.farm_location).trim(),
        planting_season: String(payload.planting_season).trim(),
        date_registered: new Date().toISOString(),
      }

      db.farmerProfiles.push(profile)
      saveDb(db)

      return {
        status: 201,
        data: serializeFarmerProfile(profile),
      }
    }

    if (segments.length >= 2) {
      const farmerId = Number(segments[1])
      const profile = db.farmerProfiles.find((item) => item.id === farmerId)

      if (!profile) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      if (segments.length === 2 && method === 'patch') {
        const canManage = authUser.roles.includes('Admin') || authUser.roles.includes('Staff')
        const isSelfFarmer = authUser.roles.includes('Farmer') && profile.user === authUser.id

        if (!canManage && !isSelfFarmer) {
          throwError(403, { detail: 'You do not have access to this farmer profile.' }, request)
        }

        const patchableFields = [
          'first_name',
          'last_name',
          'address',
          'contact_number',
          'credentials_status',
          'farm_location',
          'planting_season',
        ]

        patchableFields.forEach((field) => {
          if (request.data?.[field] != null) {
            profile[field] = request.data[field]
          }
        })

        saveDb(db)

        return {
          status: 200,
          data: serializeFarmerProfile(profile),
        }
      }

      if (segments[2] === 'credentials' && segments[3] === 'verify' && method === 'post') {
        requireRoles(authUser, ['Admin', 'Staff'], request)

        const nextStatus = String(request.data?.credentials_status || 'Verified')
        const allowedStatuses = new Set(['Verified', 'Pending', 'Rejected'])

        if (!allowedStatuses.has(nextStatus)) {
          throwError(400, { detail: 'Invalid credentials status.' }, request)
        }

        profile.credentials_status = nextStatus
        saveDb(db)

        return {
          status: 200,
          data: {
            profile: serializeFarmerProfile(profile),
            remarks: request.data?.remarks || '',
          },
        }
      }

      if (segments[2] === 'applications') {
        const canManage = authUser.roles.includes('Admin') || authUser.roles.includes('Staff')
        const isSelfFarmer = authUser.roles.includes('Farmer') && profile.user === authUser.id

        if (!canManage && !isSelfFarmer) {
          throwError(403, { detail: 'You do not have access to this farmer profile.' }, request)
        }

        if (method === 'get') {
          const rows = db.applications
            .filter((item) => item.farmer === farmerId)
            .sort((left, right) => new Date(right.application_date) - new Date(left.application_date))
            .map((item) => serializeApplication(item))

          return { status: 200, data: rows }
        }

        if (method === 'post') {
          const interventionId = Number(request.data?.intervention)
          const intervention = db.interventions.find((item) => item.id === interventionId)

          if (!intervention) {
            throwError(400, { intervention: ['Invalid intervention id.'] }, request)
          }

          const duplicate = db.applications.find(
            (item) => item.farmer === farmerId && item.intervention === interventionId,
          )

          if (duplicate) {
            throwError(400, {
              non_field_errors: ['The fields farmer, intervention must make a unique set.'],
            }, request)
          }

          const status =
            authUser.roles.includes('Farmer') && !authUser.roles.includes('Admin') && !authUser.roles.includes('Staff')
              ? 'Pending'
              : request.data?.status || 'Pending'

          const record = {
            id: nextId(db, 'applications'),
            farmer: farmerId,
            intervention: interventionId,
            application_date: new Date().toISOString(),
            status,
            remarks: String(request.data?.remarks || '').trim(),
          }

          db.applications.push(record)
          saveDb(db)

          return {
            status: 201,
            data: serializeApplication(record),
          }
        }
      }
    }
  }

  if (segments[0] === 'intervention-applications') {
    if (segments.length === 1 && method === 'get') {
      let rows = db.applications.slice()

      if (authUser.roles.includes('Farmer')) {
        const profile = findFarmerProfileByUser(db, authUser.id)
        rows = profile ? rows.filter((item) => item.farmer === profile.id) : []
      } else if (!authUser.roles.includes('Admin') && !authUser.roles.includes('Staff')) {
        rows = []
      }

      rows.sort((left, right) => new Date(right.application_date) - new Date(left.application_date))

      return {
        status: 200,
        data: rows.map((item) => serializeApplication(item)),
      }
    }

    if (segments.length === 2 && method === 'patch') {
      requireRoles(authUser, ['Admin', 'Staff'], request)

      const applicationId = Number(segments[1])
      const application = db.applications.find((item) => item.id === applicationId)

      if (!application) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      if (request.data?.status != null) {
        application.status = request.data.status
      }

      if (request.data?.remarks != null) {
        application.remarks = request.data.remarks
      }

      saveDb(db)

      return {
        status: 200,
        data: serializeApplication(application),
      }
    }
  }

  if (segments[0] === 'programs') {
    if (segments.length === 1 && method === 'get') {
      const includeArchived = parseBooleanParam(request.config?.params?.include_archived)
      let rows = db.programs.slice()

      if (authUser.roles.includes('Staff') && !authUser.roles.includes('Admin')) {
        rows = rows.filter((item) => !item.is_archived)
      } else if (!includeArchived) {
        rows = rows.filter((item) => !item.is_archived)
      }

      return {
        status: 200,
        data: rows.map((item) => serializeProgram(item)),
      }
    }

    if (segments.length === 1 && method === 'post') {
      requireRoles(authUser, ['Admin'], request)

      const payload = {
        name: String(request.data?.name || '').trim(),
        description: String(request.data?.description || ''),
        start_date: request.data?.start_date,
        end_date: request.data?.end_date,
      }

      if (!payload.name) {
        throwError(400, { name: ['This field is required.'] }, request)
      }

      if (!payload.start_date) {
        throwError(400, { start_date: ['This field is required.'] }, request)
      }

      if (!payload.end_date) {
        throwError(400, { end_date: ['This field is required.'] }, request)
      }

      applyProgramValidation(db, payload, null, request)

      const nowStamp = new Date().toISOString()
      const program = {
        id: nextId(db, 'programs'),
        name: payload.name,
        description: payload.description,
        start_date: payload.start_date,
        end_date: payload.end_date,
        is_archived: false,
        created_at: nowStamp,
        updated_at: nowStamp,
      }

      db.programs.push(program)
      saveDb(db)

      return {
        status: 201,
        data: serializeProgram(program),
      }
    }

    if (segments.length === 2 && method === 'patch') {
      requireRoles(authUser, ['Admin'], request)

      const programId = Number(segments[1])
      const program = db.programs.find((item) => item.id === programId)

      if (!program) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      applyProgramValidation(db, request.data || {}, program, request)

      const patchable = ['name', 'description', 'start_date', 'end_date', 'is_archived']
      patchable.forEach((field) => {
        if (request.data?.[field] != null) {
          program[field] = request.data[field]
        }
      })

      program.updated_at = new Date().toISOString()
      saveDb(db)

      return {
        status: 200,
        data: serializeProgram(program),
      }
    }

    if (segments.length === 2 && method === 'delete') {
      requireRoles(authUser, ['Admin'], request)

      const programId = Number(segments[1])
      const program = db.programs.find((item) => item.id === programId)

      if (!program) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      program.is_archived = true
      program.updated_at = new Date().toISOString()

      db.interventions
        .filter((item) => item.program === programId)
        .forEach((intervention) => {
          intervention.is_archived = true
          intervention.updated_at = new Date().toISOString()
        })

      saveDb(db)

      return {
        status: 204,
        data: null,
      }
    }
  }

  if (segments[0] === 'interventions') {
    if (segments.length === 1 && method === 'get') {
      const includeArchived = parseBooleanParam(request.config?.params?.include_archived)
      let rows = db.interventions.slice()

      if (authUser.roles.includes('Staff') && !authUser.roles.includes('Admin')) {
        rows = rows.filter((item) => !item.is_archived)
      } else if (!includeArchived) {
        rows = rows.filter((item) => !item.is_archived)
      }

      rows = rows.filter((item) => {
        const program = db.programs.find((entry) => entry.id === item.program)
        if (!program) return false

        if (authUser.roles.includes('Admin') && includeArchived) {
          return true
        }

        return !program.is_archived
      })

      return {
        status: 200,
        data: rows.map((item) => serializeIntervention(item)),
      }
    }

    if (segments.length === 1 && method === 'post') {
      requireRoles(authUser, ['Admin'], request)

      const payload = {
        program: request.data?.program,
        name: String(request.data?.name || '').trim(),
        description: String(request.data?.description || ''),
        start_date: request.data?.start_date,
        end_date: request.data?.end_date,
      }

      if (!payload.program) {
        throwError(400, { program: ['Program is required.'] }, request)
      }

      if (!payload.name) {
        throwError(400, { name: ['This field is required.'] }, request)
      }

      if (!payload.start_date) {
        throwError(400, { start_date: ['This field is required.'] }, request)
      }

      if (!payload.end_date) {
        throwError(400, { end_date: ['This field is required.'] }, request)
      }

      const targetProgramId = applyInterventionValidation(db, payload, null, request)
      const nowStamp = new Date().toISOString()

      const intervention = {
        id: nextId(db, 'interventions'),
        program: targetProgramId,
        name: payload.name,
        description: payload.description,
        start_date: payload.start_date,
        end_date: payload.end_date,
        is_archived: false,
        created_at: nowStamp,
        updated_at: nowStamp,
      }

      db.interventions.push(intervention)
      saveDb(db)

      return {
        status: 201,
        data: serializeIntervention(intervention),
      }
    }

    if (segments.length === 2 && method === 'patch') {
      requireRoles(authUser, ['Admin'], request)

      const interventionId = Number(segments[1])
      const intervention = db.interventions.find((item) => item.id === interventionId)

      if (!intervention) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      const targetProgramId = applyInterventionValidation(db, request.data || {}, intervention, request)
      const patchable = ['name', 'description', 'start_date', 'end_date', 'is_archived']

      if (request.data?.program != null) {
        intervention.program = targetProgramId
      }

      patchable.forEach((field) => {
        if (request.data?.[field] != null) {
          intervention[field] = request.data[field]
        }
      })

      intervention.updated_at = new Date().toISOString()
      saveDb(db)

      return {
        status: 200,
        data: serializeIntervention(intervention),
      }
    }

    if (segments.length === 2 && method === 'delete') {
      requireRoles(authUser, ['Admin'], request)

      const interventionId = Number(segments[1])
      const intervention = db.interventions.find((item) => item.id === interventionId)

      if (!intervention) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      intervention.is_archived = true
      intervention.updated_at = new Date().toISOString()
      saveDb(db)

      return {
        status: 204,
        data: null,
      }
    }
  }

  if (segments[0] === 'inventory-catalog') {
    if (segments.length === 1 && method === 'get') {
      return {
        status: 200,
        data: db.inventoryCatalog
          .slice()
          .sort((left, right) => left.name.localeCompare(right.name))
          .map((item) => serializeCatalogItem(item)),
      }
    }

    if (segments.length === 1 && method === 'post') {
      requireRoles(authUser, ['Admin', 'Staff'], request)

      const name = String(request.data?.name || '').trim()
      if (!name) {
        throwError(400, { name: ['This field is required.'] }, request)
      }

      const duplicate = db.inventoryCatalog.find(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      )

      if (duplicate) {
        throwError(400, { name: ['Inventory catalog item with this name already exists.'] }, request)
      }

      const lowStockThreshold = Number(request.data?.low_stock_threshold ?? 10)
      if (Number.isNaN(lowStockThreshold) || lowStockThreshold < 0) {
        throwError(400, { low_stock_threshold: ['Ensure this value is greater than or equal to 0.'] }, request)
      }

      const nowStamp = new Date().toISOString()

      const item = {
        id: nextId(db, 'inventoryCatalog'),
        name,
        item_group: request.data?.item_group || 'other',
        unit_of_measure: String(request.data?.unit_of_measure || 'kg').trim() || 'kg',
        low_stock_threshold: lowStockThreshold,
        is_active: request.data?.is_active ?? true,
        created_at: nowStamp,
        updated_at: nowStamp,
      }

      db.inventoryCatalog.push(item)
      saveDb(db)

      return {
        status: 201,
        data: serializeCatalogItem(item),
      }
    }

    if (segments.length === 2 && method === 'patch') {
      requireRoles(authUser, ['Admin', 'Staff'], request)

      const catalogId = Number(segments[1])
      const item = db.inventoryCatalog.find((entry) => entry.id === catalogId)

      if (!item) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      if (request.data?.name != null) {
        const nextName = String(request.data.name).trim()
        if (!nextName) {
          throwError(400, { name: ['This field may not be blank.'] }, request)
        }

        const duplicate = db.inventoryCatalog.find(
          (entry) => entry.id !== item.id && entry.name.toLowerCase() === nextName.toLowerCase(),
        )

        if (duplicate) {
          throwError(400, { name: ['Inventory catalog item with this name already exists.'] }, request)
        }

        item.name = nextName
      }

      if (request.data?.item_group != null) item.item_group = request.data.item_group
      if (request.data?.unit_of_measure != null) item.unit_of_measure = request.data.unit_of_measure

      if (request.data?.low_stock_threshold != null) {
        const threshold = Number(request.data.low_stock_threshold)
        if (Number.isNaN(threshold) || threshold < 0) {
          throwError(400, { low_stock_threshold: ['Ensure this value is greater than or equal to 0.'] }, request)
        }

        item.low_stock_threshold = threshold
      }

      if (request.data?.is_active != null) item.is_active = Boolean(request.data.is_active)
      item.updated_at = new Date().toISOString()

      saveDb(db)

      return {
        status: 200,
        data: serializeCatalogItem(item),
      }
    }
  }

  if (segments[0] === 'inventory') {
    if (segments.length === 1 && method === 'get') {
      return {
        status: 200,
        data: db.inventory.map((item) => serializeInventoryItem(db, item)),
      }
    }

    if (segments.length === 2 && segments[1] === 'alerts' && method === 'get') {
      return {
        status: 200,
        data: getInventoryAlerts(db, db.inventory),
      }
    }
  }

  if (segments[0] === 'distributors' && segments.length === 1 && method === 'get') {
    return {
      status: 200,
      data: db.distributors
        .slice()
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((item) => serializeDistributor(item)),
    }
  }

  if (segments[0] === 'distributions') {
    if (segments.length === 1 && method === 'get') {
      let rows = db.distributions.slice()

      if (authUser.roles.includes('Farmer')) {
        const profile = findFarmerProfileByUser(db, authUser.id)
        rows = profile ? rows.filter((item) => item.farmer === profile.id) : []
      } else if (authUser.roles.includes('Distributor')) {
        const distributor = findDistributorByUser(db, authUser.id)
        rows = distributor ? rows.filter((item) => item.assigned_distributor === distributor.id) : []
      }

      rows.sort((left, right) => new Date(right.distribution_date) - new Date(left.distribution_date))

      return {
        status: 200,
        data: rows.map((item) => serializeDistribution(db, item)),
      }
    }

    if (segments.length === 1 && method === 'post') {
      requireRoles(authUser, ['Admin', 'Staff'], request)

      const farmerId = Number(request.data?.farmer)
      const inventoryId = Number(request.data?.input_inventory)
      const quantityReleased = Number(request.data?.quantity_released)
      const distributorId = request.data?.assigned_distributor == null ? null : Number(request.data.assigned_distributor)

      if (!db.farmerProfiles.some((item) => item.id === farmerId)) {
        throwError(400, { farmer: ['Invalid farmer id.'] }, request)
      }

      if (!db.inventory.some((item) => item.id === inventoryId)) {
        throwError(400, { input_inventory: ['Invalid inventory id.'] }, request)
      }

      if (!Number.isFinite(quantityReleased) || quantityReleased <= 0) {
        throwError(400, { quantity_released: ['A valid quantity is required.'] }, request)
      }

      if (distributorId != null && !db.distributors.some((item) => item.id === distributorId)) {
        throwError(400, { assigned_distributor: ['Invalid distributor id.'] }, request)
      }

      const record = {
        id: nextId(db, 'distributions'),
        farmer: farmerId,
        input_inventory: inventoryId,
        quantity_released: quantityReleased,
        assigned_distributor: distributorId,
        distribution_date: new Date().toISOString(),
        release_officer: authUser.id,
        status: 'Pending',
        remarks: String(request.data?.remarks || '').trim(),
      }

      db.distributions.push(record)
      createDistributionLog(
        db,
        record.id,
        '',
        'Pending',
        record.remarks,
        authUser.id,
      )

      saveDb(db)

      return {
        status: 201,
        data: serializeDistribution(db, record),
      }
    }

    if (segments.length === 2 && method === 'patch') {
      const distributionId = Number(segments[1])
      const record = db.distributions.find((item) => item.id === distributionId)

      if (!record) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      const isAdminOrStaff = authUser.roles.includes('Admin') || authUser.roles.includes('Staff')
      const isDistributor = authUser.roles.includes('Distributor')

      if (!isAdminOrStaff && !isDistributor) {
        throwError(403, { detail: 'You do not have permission to update this record.' }, request)
      }

      if (isDistributor && !isAdminOrStaff) {
        const distributor = findDistributorByUser(db, authUser.id)

        if (!distributor || record.assigned_distributor !== distributor.id) {
          throwError(403, { detail: 'You can only update records assigned to you.' }, request)
        }

        const incomingFields = Object.keys(request.data || {})
        const allowedFields = new Set(['status', 'remarks'])

        const hasInvalidField = incomingFields.some((field) => !allowedFields.has(field))
        if (hasInvalidField) {
          throwError(403, { detail: 'Distributors can only update status and remarks.' }, request)
        }

        if (request.data?.status && !ALLOWED_DISTRIBUTOR_STATUSES.has(request.data.status)) {
          throwError(403, { detail: 'Invalid distributor status update.' }, request)
        }

        if (record.status === 'Pending' || record.status === 'Cancelled') {
          throwError(403, {
            detail: 'Distribution must be released before delivery status updates.',
          }, request)
        }
      }

      const previousStatus = record.status
      const previousRemarks = record.remarks || ''

      const patchableFields = [
        'farmer',
        'input_inventory',
        'quantity_released',
        'assigned_distributor',
        'status',
        'remarks',
      ]

      patchableFields.forEach((field) => {
        if (request.data?.[field] != null) {
          record[field] = request.data[field]
        }
      })

      if ((record.status || '') !== previousStatus || (record.remarks || '') !== previousRemarks) {
        createDistributionLog(
          db,
          record.id,
          previousStatus,
          record.status,
          request.data?.remarks ?? record.remarks,
          authUser.id,
        )
      }

      saveDb(db)

      return {
        status: 200,
        data: serializeDistribution(db, record),
      }
    }

    if (segments.length === 2 && method === 'delete') {
      requireRoles(authUser, ['Admin', 'Staff'], request)

      const distributionId = Number(segments[1])
      const index = db.distributions.findIndex((item) => item.id === distributionId)

      if (index < 0) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      db.distributions.splice(index, 1)
      db.distributionStatusLogs = db.distributionStatusLogs.filter(
        (item) => item.distribution !== distributionId,
      )
      saveDb(db)

      return {
        status: 204,
        data: null,
      }
    }

    if (segments.length === 3 && segments[2] === 'release' && method === 'post') {
      requireRoles(authUser, ['Admin', 'Staff'], request)

      const distributionId = Number(segments[1])
      const record = db.distributions.find((item) => item.id === distributionId)

      if (!record) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      if (record.status !== 'Pending') {
        throwError(400, { detail: 'Only pending distributions can be released.' }, request)
      }

      const inventoryItem = db.inventory.find((item) => item.id === record.input_inventory)
      if (!inventoryItem) {
        throwError(400, { detail: 'Linked inventory item not found.' }, request)
      }

      if (Number(inventoryItem.quantity_available || 0) < Number(record.quantity_released || 0)) {
        throwError(400, { detail: 'Insufficient inventory available for release.' }, request)
      }

      inventoryItem.quantity_available =
        Number(inventoryItem.quantity_available || 0) - Number(record.quantity_released || 0)
      inventoryItem.last_updated = new Date().toISOString()

      createInventoryTransaction(db, {
        inventory: inventoryItem.id,
        transaction_type: 'allocated',
        quantity: Number(record.quantity_released || 0),
        reference: `distribution:${record.id}`,
      })

      record.status = 'Released'
      record.release_officer = authUser.id

      createDistributionLog(
        db,
        record.id,
        'Pending',
        'Released',
        'Distribution released for delivery.',
        authUser.id,
      )

      saveDb(db)

      return {
        status: 200,
        data: serializeDistribution(db, record),
      }
    }

    if (segments.length === 2 && segments[1] === 'bulk-release' && method === 'post') {
      requireRoles(authUser, ['Admin', 'Staff'], request)

      const ids = Array.isArray(request.data?.distribution_ids)
        ? request.data.distribution_ids.map((item) => Number(item))
        : null

      if (!ids || ids.length === 0) {
        throwError(400, { detail: 'distribution_ids must be a non-empty array.' }, request)
      }

      const releasedIds = []
      const skipped = []

      ids.forEach((distributionId) => {
        const record = db.distributions.find((item) => item.id === distributionId)

        if (!record) {
          skipped.push({ id: distributionId, reason: 'Not found.' })
          return
        }

        if (record.status !== 'Pending') {
          skipped.push({ id: record.id, reason: 'Only pending distributions can be released.' })
          return
        }

        const inventoryItem = db.inventory.find((item) => item.id === record.input_inventory)
        if (!inventoryItem) {
          skipped.push({ id: record.id, reason: 'Linked inventory item not found.' })
          return
        }

        if (Number(inventoryItem.quantity_available || 0) < Number(record.quantity_released || 0)) {
          skipped.push({ id: record.id, reason: 'Insufficient inventory available for release.' })
          return
        }

        inventoryItem.quantity_available =
          Number(inventoryItem.quantity_available || 0) - Number(record.quantity_released || 0)
        inventoryItem.last_updated = new Date().toISOString()

        createInventoryTransaction(db, {
          inventory: inventoryItem.id,
          transaction_type: 'allocated',
          quantity: Number(record.quantity_released || 0),
          reference: `distribution:${record.id}`,
        })

        const previousStatus = record.status
        record.status = 'Released'
        record.release_officer = authUser.id

        createDistributionLog(
          db,
          record.id,
          previousStatus,
          'Released',
          'Distribution released via bulk action.',
          authUser.id,
        )

        releasedIds.push(record.id)
      })

      saveDb(db)

      return {
        status: 200,
        data: {
          released_ids: releasedIds,
          skipped,
        },
      }
    }

    if (segments.length === 3 && segments[2] === 'timeline' && method === 'get') {
      const distributionId = Number(segments[1])
      const record = db.distributions.find((item) => item.id === distributionId)

      if (!record) {
        throwError(404, { detail: 'Not found.' }, request)
      }

      if (authUser.roles.includes('Farmer')) {
        const profile = findFarmerProfileByUser(db, authUser.id)
        if (!profile || profile.id !== record.farmer) {
          throwError(403, { detail: 'You do not have access to this record.' }, request)
        }
      }

      if (authUser.roles.includes('Distributor')) {
        const distributor = findDistributorByUser(db, authUser.id)
        if (!distributor || distributor.id !== record.assigned_distributor) {
          throwError(403, { detail: 'You do not have access to this record.' }, request)
        }
      }

      const rows = db.distributionStatusLogs
        .filter((item) => item.distribution === distributionId)
        .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
        .map((item) => serializeDistributionStatusLog(db, item))

      return {
        status: 200,
        data: rows,
      }
    }
  }

  throwError(404, { detail: `Demo route not implemented for ${request.method.toUpperCase()} ${request.url}` }, request)
}

export function createDemoApiClient() {
  async function execute(method, url, data, config) {
    const db = loadDb()

    const request = {
      method,
      url,
      data,
      config: config || {},
    }

    const response = routeRequest(db, request)

    return {
      status: response.status,
      data: deepClone(response.data),
      config: {
        method,
        url,
      },
    }
  }

  return {
    get(url, config) {
      return execute('get', url, undefined, config)
    },
    post(url, data, config) {
      return execute('post', url, data, config)
    },
    patch(url, data, config) {
      return execute('patch', url, data, config)
    },
    delete(url, config) {
      return execute('delete', url, undefined, config)
    },
    put(url, data, config) {
      return execute('put', url, data, config)
    },
  }
}
