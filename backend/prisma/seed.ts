import { PrismaClient, UserRole, AccessLevel, AppModule, AdmissionGateStatus, AdmissionDepartment } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Phase 0 seed tenant id — matches the migration 20260505040000 backfill so
// fresh `prisma migrate reset && db:seed` puts demo data on the same row
// the migration would attach pre-existing rows to.
const SEED_TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('🌱 Starting seed...');

  // Create the seed tenant first — every other entity needs a tenantId
  // foreign key. Idempotent for re-runs.
  const tenant = await prisma.tenant.upsert({
    where: { id: SEED_TENANT_ID },
    update: {},
    create: {
      id: SEED_TENANT_ID,
      slug: 'ics',
      name: 'International Christian School of Rio de Janeiro',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Seed tenant created:', tenant.slug);

  // Create system settings
  const settings = await prisma.systemSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      schoolName: 'School Lab',
      defaultLanguage: 'pt',
      dateFormat: 'DD/MM/YYYY',
      currency: 'BRL',
      timezone: 'America/Sao_Paulo',
    },
  });
  console.log('✅ System settings created');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school-lab.app' },
    update: {},
    create: {
      email: 'admin@school-lab.app',
      passwordHash: adminPasswordHash,
      displayName: 'Administrador',
      fullName: 'Administrador do Sistema',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      tenantId: tenant.id,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create MASTER user - Victor Cesar (full access)
  const masterPasswordHash = await bcrypt.hash('Dron3120@', 12);
  const master = await prisma.user.upsert({
    where: { email: 'victorcesar2031@gmail.com' },
    update: {
      passwordHash: masterPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      email: 'victorcesar2031@gmail.com',
      passwordHash: masterPasswordHash,
      displayName: 'Victor Cesar',
      fullName: 'Victor Cesar Ferreira de Oliveira',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      isPlatformAdmin: true,
      tenantId: tenant.id,
    },
  });
  console.log('✅ Master user created:', master.email);

  // Create ADMIN user - Bruno Pellegrino
  const bpellegrinoPasswordHash = await bcrypt.hash('1q2w3e4r5t', 12);
  const bpellegrino = await prisma.user.upsert({
    where: { email: 'bpellegrino@ris.school' },
    update: {
      passwordHash: bpellegrinoPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      email: 'bpellegrino@ris.school',
      passwordHash: bpellegrinoPasswordHash,
      displayName: 'Bruno Pellegrino',
      fullName: 'Bruno Pellegrino',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      tenantId: tenant.id,
    },
  });
  console.log('✅ Admin user created:', bpellegrino.email);

  // Create module access for admin
  const modules: AppModule[] = ['COMMUNICATION', 'PROCUREMENT', 'ASSETS', 'CRM', 'GED', 'ADMIN'];
  for (const module of modules) {
    await prisma.moduleAccess.upsert({
      where: { userId_module: { userId: admin.id, module } },
      update: {},
      create: {
        userId: admin.id,
        module,
        accessLevel: 'ADMIN',
      },
    });
  }

  // Create module access for master (full access to all modules)
  for (const module of modules) {
    await prisma.moduleAccess.upsert({
      where: { userId_module: { userId: master.id, module } },
      update: { accessLevel: 'ADMIN' },
      create: {
        userId: master.id,
        module,
        accessLevel: 'ADMIN',
      },
    });
  }

  // Create module access for bpellegrino (full access to all modules)
  for (const module of modules) {
    await prisma.moduleAccess.upsert({
      where: { userId_module: { userId: bpellegrino.id, module } },
      update: { accessLevel: 'ADMIN' },
      create: {
        userId: bpellegrino.id,
        module,
        accessLevel: 'ADMIN',
      },
    });
  }
  console.log('✅ Admin and Master module access configured');

  // Create asset categories
  const categories = [
    { name: 'Electronics', description: 'Electronic equipment', icon: 'Monitor' },
    { name: 'Furniture', description: 'Office and classroom furniture', icon: 'Armchair' },
    { name: 'Vehicles', description: 'School vehicles', icon: 'Car' },
    { name: 'Equipment', description: 'General equipment', icon: 'Wrench' },
    { name: 'Sports', description: 'Sports equipment', icon: 'Dumbbell' },
    { name: 'Musical', description: 'Musical instruments', icon: 'Music' },
  ];

  for (const cat of categories) {
    await prisma.assetCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Asset categories created');

  // Create asset locations
  const locations = [
    { name: 'Main Building', description: 'Main school building' },
    { name: 'Admin Office', description: 'Administrative offices' },
    { name: 'IT Room', description: 'IT equipment room' },
    { name: 'Library', description: 'School library' },
    { name: 'Gymnasium', description: 'Sports gymnasium' },
    { name: 'Cafeteria', description: 'School cafeteria' },
    { name: 'Storage', description: 'Main storage area' },
  ];

  for (const loc of locations) {
    await prisma.assetLocation.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    });
  }
  console.log('✅ Asset locations created');

  // Create demo users (all departments)
  const demoUsers = [
    { email: 'manager@school-lab.app', displayName: 'Maria Silva', role: 'MANAGER' as UserRole, area: 'Administration' },
    { email: 'teacher@school-lab.app', displayName: 'João Santos', role: 'TEACHER' as UserRole, area: 'Academic' },
    { email: 'it@school-lab.app', displayName: 'Carlos Tech', role: 'IT' as UserRole, area: 'IT' },
    { email: 'finance@school-lab.app', displayName: 'Ana Costa', role: 'FINANCE' as UserRole, area: 'Finance' },
    { email: 'admissions@school-lab.app', displayName: 'Paula Dias', role: 'ADMISSIONS' as UserRole, area: 'Admissions' },
    { email: 'psicologia@school-lab.app', displayName: 'Dra. Mariana Psico', role: 'PSYCHOLOGY' as UserRole, area: 'Psychology' },
    { email: 'saude@school-lab.app', displayName: 'Dr. Roberto Saúde', role: 'HEALTH' as UserRole, area: 'Health' },
    { email: 'juridico@school-lab.app', displayName: 'Carla Jurídico', role: 'LEGAL' as UserRole, area: 'Legal' },
    { email: 'diretoria@school-lab.app', displayName: 'Fernando Diretor', role: 'DIRECTOR' as UserRole, area: 'Direction' },
    { email: 'coordenacao@school-lab.app', displayName: 'Lucia Coord', role: 'COORDINATOR' as UserRole, area: 'Coordination' },
    { email: 'secretaria@school-lab.app', displayName: 'Sandra Secretaria', role: 'SECRETARY' as UserRole, area: 'Secretariat' },
  ];

  const demoPasswordHash = await bcrypt.hash('demo123', 12);

  for (const user of demoUsers) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash: demoPasswordHash,
        displayName: user.displayName,
        fullName: user.displayName,
        role: user.role,
        area: user.area,
        status: 'ACTIVE',
        emailVerified: true,
        tenantId: tenant.id,
      },
    });

    // Set default module access based on role
    const roleModuleAccess: Record<string, { module: AppModule; level: AccessLevel }[]> = {
      MANAGER: [
        { module: 'COMMUNICATION', level: 'ADMIN' },
        { module: 'PROCUREMENT', level: 'ADMIN' },
        { module: 'ASSETS', level: 'EDIT' },
        { module: 'CRM', level: 'EDIT' },
        { module: 'GED', level: 'EDIT' },
      ],
      TEACHER: [
        { module: 'COMMUNICATION', level: 'EDIT' },
        { module: 'GED', level: 'VIEW' },
      ],
      IT: [
        { module: 'COMMUNICATION', level: 'ADMIN' },
        { module: 'ASSETS', level: 'EDIT' },
        { module: 'GED', level: 'VIEW' },
      ],
      FINANCE: [
        { module: 'COMMUNICATION', level: 'VIEW' },
        { module: 'PROCUREMENT', level: 'ADMIN' },
        { module: 'GED', level: 'VIEW' },
      ],
      ADMISSIONS: [
        { module: 'COMMUNICATION', level: 'VIEW' },
        { module: 'CRM', level: 'ADMIN' },
        { module: 'GED', level: 'EDIT' },
      ],
      PSYCHOLOGY: [
        { module: 'COMMUNICATION', level: 'VIEW' },
        { module: 'CRM', level: 'EDIT' },
      ],
      HEALTH: [
        { module: 'COMMUNICATION', level: 'VIEW' },
        { module: 'CRM', level: 'EDIT' },
      ],
      LEGAL: [
        { module: 'COMMUNICATION', level: 'VIEW' },
        { module: 'CRM', level: 'EDIT' },
      ],
      DIRECTOR: [
        { module: 'COMMUNICATION', level: 'VIEW' },
        { module: 'CRM', level: 'ADMIN' },
      ],
      COORDINATOR: [
        { module: 'COMMUNICATION', level: 'VIEW' },
        { module: 'CRM', level: 'EDIT' },
      ],
      SECRETARY: [
        { module: 'COMMUNICATION', level: 'VIEW' },
        { module: 'CRM', level: 'EDIT' },
      ],
    };

    const access = roleModuleAccess[user.role] || [];
    for (const acc of access) {
      await prisma.moduleAccess.upsert({
        where: { userId_module: { userId: created.id, module: acc.module } },
        update: {},
        create: {
          userId: created.id,
          module: acc.module,
          accessLevel: acc.level,
        },
      });
    }
  }
  console.log('✅ Demo users created');

  // Create default channel
  const generalChannel = await prisma.channel.upsert({
    where: { id: 'general' },
    update: {},
    create: {
      id: 'general',
      name: 'general',
      description: 'Canal geral para todos os funcionários',
      type: 'PUBLIC',
      createdBy: admin.id,
    },
  });

  // Add admin to channel
  await prisma.channelMember.upsert({
    where: { channelId_userId: { channelId: generalChannel.id, userId: admin.id } },
    update: {},
    create: {
      channelId: generalChannel.id,
      userId: admin.id,
      isOwner: true,
      isAdmin: true,
    },
  });

  // Add master to channel
  await prisma.channelMember.upsert({
    where: { channelId_userId: { channelId: generalChannel.id, userId: master.id } },
    update: {},
    create: {
      channelId: generalChannel.id,
      userId: master.id,
      isOwner: true,
      isAdmin: true,
    },
  });
  console.log('✅ Default channel created');

  // Create default kanban columns
  // Only NEW_LEAD is marked as isDefault (protected from deletion) - it's where new leads are automatically placed
  const kanbanColumns = [
    { id: 'kc-new-lead', name: 'Novo Lead', slug: 'NEW_LEAD', color: '#94A3B8', order: 0, isFinal: false, isDefault: true },
    { id: 'kc-contacted', name: 'Contatado', slug: 'CONTACTED', color: '#3B82F6', order: 1, isFinal: false, isDefault: false },
    { id: 'kc-visit-scheduled', name: 'Visita Agendada', slug: 'VISIT_SCHEDULED', color: '#8B5CF6', order: 2, isFinal: false, isDefault: false },
    { id: 'kc-form-received', name: 'Formulário Recebido', slug: 'FORM_RECEIVED', color: '#06B6D4', order: 3, isFinal: false, isDefault: false },
    { id: 'kc-interview-scheduled', name: 'Entrevista Agendada', slug: 'INTERVIEW_SCHEDULED', color: '#F59E0B', order: 4, isFinal: false, isDefault: false },
    { id: 'kc-documents-pending', name: 'Documentos Pendentes', slug: 'DOCUMENTS_PENDING', color: '#EC4899', order: 5, isFinal: false, isDefault: false },
    { id: 'kc-under-analysis', name: 'Em Análise', slug: 'UNDER_ANALYSIS', color: '#6366F1', order: 6, isFinal: false, isDefault: false },
    { id: 'kc-vivencia', name: 'Vivência', slug: 'VIVENCIA', color: '#A855F7', order: 7, isFinal: false, isDefault: false },
    { id: 'kc-approved', name: 'Aprovado', slug: 'APPROVED', color: '#10B981', order: 8, isFinal: false, isDefault: false },
    { id: 'kc-waitlist', name: 'Lista de Espera', slug: 'WAITLIST', color: '#F97316', order: 9, isFinal: false, isDefault: false },
    { id: 'kc-enrolled', name: 'Matriculado', slug: 'ENROLLED', color: '#22C55E', order: 10, isFinal: false, isDefault: false },
    { id: 'kc-rejected', name: 'Rejeitado', slug: 'REJECTED', color: '#EF4444', order: 11, isFinal: true, isDefault: false },
    { id: 'kc-lost', name: 'Perdido', slug: 'LOST', color: '#6B7280', order: 12, isFinal: true, isDefault: false },
  ];

  for (const column of kanbanColumns) {
    await prisma.kanbanColumn.upsert({
      where: {
        tenantId_slug: { tenantId: tenant.id, slug: column.slug },
      },
      update: {},
      create: { ...column, tenantId: tenant.id },
    });
  }
  console.log('✅ Kanban columns created');

  // ── Gate Step Configurations (BPMN approval gates) ──────────────
  const gateConfigs: {
    gateStep: AdmissionGateStatus;
    department: AdmissionDepartment;
    isRequired: boolean;
    approvalOrder: number;
    allowedRoles: UserRole[];
    description: string;
  }[] = [
    // Phase 1: Contato — Admissions approves F1
    { gateStep: 'FORM_APPROVED', department: 'ADMISSIONS', isRequired: true, approvalOrder: 0, allowedRoles: ['ADMISSIONS', 'ADMIN'], description: 'Admissões analisa e aprova o formulário F1' },

    // Phase 2: Pré Matrícula — Admissions approves after visit/interview
    { gateStep: 'VISIT_APPROVED', department: 'ADMISSIONS', isRequired: true, approvalOrder: 0, allowedRoles: ['ADMISSIONS', 'ADMIN'], description: 'Admissões aprova após visita/entrevista' },

    // Phase 3: Vivência — Multi-department evaluations
    { gateStep: 'EVALUATION_COMPLETED', department: 'PSYCHOLOGY', isRequired: true, approvalOrder: 0, allowedRoles: ['PSYCHOLOGY', 'ADMIN'], description: 'Avaliação psicológica do aluno' },
    { gateStep: 'EVALUATION_COMPLETED', department: 'HEALTH', isRequired: true, approvalOrder: 1, allowedRoles: ['HEALTH', 'ADMIN'], description: 'Avaliação de saúde do aluno' },
    { gateStep: 'EVALUATION_COMPLETED', department: 'COORDINATION', isRequired: true, approvalOrder: 2, allowedRoles: ['COORDINATOR', 'ADMIN'], description: 'Coordenação analisa vivência e nivelamento' },
    { gateStep: 'EVALUATION_COMPLETED', department: 'SECRETARIAT', isRequired: false, approvalOrder: 3, allowedRoles: ['SECRETARY', 'ADMIN'], description: 'Secretaria valida documentação' },

    // Phase 3→4: Aprovação final
    { gateStep: 'APPROVED', department: 'ADMISSIONS', isRequired: true, approvalOrder: 0, allowedRoles: ['ADMISSIONS', 'ADMIN'], description: 'Admissões dá aprovação final' },
    { gateStep: 'APPROVED', department: 'DIRECTOR', isRequired: false, approvalOrder: 1, allowedRoles: ['DIRECTOR', 'ADMIN'], description: 'Diretoria aprova (questões críticas)' },

    // Phase 5: Contrato — Legal + Financial
    { gateStep: 'CONTRACT_PENDING', department: 'LEGAL', isRequired: true, approvalOrder: 0, allowedRoles: ['LEGAL', 'ADMIN'], description: 'Jurídico analisa contrato' },
    { gateStep: 'CONTRACT_PENDING', department: 'FINANCE', isRequired: true, approvalOrder: 1, allowedRoles: ['FINANCE', 'ADMIN'], description: 'Financeiro aprova termos e pagamento' },
  ];

  for (const cfg of gateConfigs) {
    await prisma.gateStepConfig.upsert({
      where: {
        tenantId_gateStep_department: {
          tenantId: tenant.id,
          gateStep: cfg.gateStep,
          department: cfg.department,
        },
      },
      update: { isRequired: cfg.isRequired, approvalOrder: cfg.approvalOrder, allowedRoles: cfg.allowedRoles, description: cfg.description },
      create: { ...cfg, tenantId: tenant.id },
    });
  }
  console.log('✅ Gate step configurations created (10 configs)');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   🔑 MASTER: victorcesar2031@gmail.com / Dron3120@');
  console.log('   Admin: admin@school-lab.app / admin123');
  console.log('   Demo users: [email]@school-lab.app / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
