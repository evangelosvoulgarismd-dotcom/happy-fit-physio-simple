// Δεδομένα μυϊκών ομάδων (πρόχειρα κείμενα, να ελεγχθούν από τον Ευάγγελο). Ίδια με το seed του migration_anatomy_groups.sql.
export const MUSCLE_GROUPS = [
 {
  "slug": "deltoids",
  "name_el": "Δελτοειδής",
  "name_en": "Deltoids",
  "region": "shoulders",
  "order": 10,
  "desc_el": "Τριγωνικός μυς που καλύπτει την άρθρωση του ώμου, με πρόσθια, μέση και οπίσθια μοίρα.",
  "desc_en": "Triangular muscle covering the shoulder joint, with anterior, middle and posterior parts.",
  "fn_el": "Μέση μοίρα: απαγωγή του βραχίονα. Πρόσθια: κάμψη και έσω στροφή. Οπίσθια: έκταση και έξω στροφή.",
  "fn_en": "Middle part: arm abduction. Anterior: flexion and internal rotation. Posterior: extension and external rotation."
 },
 {
  "slug": "pectoralis_major",
  "name_el": "Μείζων θωρακικός",
  "name_en": "Pectoralis major",
  "region": "chest",
  "order": 20,
  "desc_el": "Μεγάλος επιφανειακός μυς του θώρακα, με κλειδική και στερνοπλευρική μοίρα.",
  "desc_en": "Large superficial chest muscle with clavicular and sternocostal parts.",
  "fn_el": "Προσαγωγή, κάμψη και έσω στροφή του βραχίονα, οριζόντια προσαγωγή (ώθηση προς τα εμπρός).",
  "fn_en": "Adducts, flexes and internally rotates the arm; horizontal adduction (pushing forward)."
 },
 {
  "slug": "pectoralis_minor",
  "name_el": "Ελάσσων θωρακικός",
  "name_en": "Pectoralis minor",
  "region": "chest",
  "order": 21,
  "desc_el": "Βαθύς, μικρότερος μυς κάτω από τον μείζονα θωρακικό, από τις πλευρές στην κορακοειδή απόφυση της ωμοπλάτης.",
  "desc_en": "Deep, smaller muscle beneath pectoralis major, from the ribs to the scapular coracoid process.",
  "fn_el": "Έλξη της ωμοπλάτης προς τα εμπρός και κάτω, στήριξη της ωμοπλάτης.",
  "fn_en": "Draws the scapula forward and down; stabilizes the scapula."
 },
 {
  "slug": "trapezius",
  "name_el": "Τραπεζοειδής",
  "name_en": "Trapezius",
  "region": "back",
  "order": 30,
  "desc_el": "Επιφανειακός μυς πλάτης και αυχένα με άνω, μέση και κάτω μοίρα.",
  "desc_en": "Superficial back and neck muscle with upper, middle and lower parts.",
  "fn_el": "Ανύψωση (άνω), προσαγωγή (μέση) και πτώση (κάτω) της ωμοπλάτης, στροφή της ωμοπλάτης.",
  "fn_en": "Elevates (upper), retracts (middle) and depresses (lower) the scapula; scapular rotation."
 },
 {
  "slug": "latissimus_dorsi",
  "name_el": "Πλατύς ραχιαίος",
  "name_en": "Latissimus dorsi",
  "region": "back",
  "order": 31,
  "desc_el": "Ο μεγαλύτερος μυς της πλάτης, από τη σπονδυλική στήλη και τη λεκάνη στο βραχιόνιο οστό.",
  "desc_en": "The largest back muscle, from the spine and pelvis to the humerus.",
  "fn_el": "Έκταση, προσαγωγή και έσω στροφή του βραχίονα (έλξη προς τα κάτω και πίσω).",
  "fn_en": "Extends, adducts and internally rotates the arm (pulling down and back)."
 },
 {
  "slug": "rhomboids",
  "name_el": "Ρομβοειδείς",
  "name_en": "Rhomboids",
  "region": "back",
  "order": 32,
  "desc_el": "Μείζων και ελάσσων ρομβοειδής, βαθιά ανάμεσα στη σπονδυλική στήλη και την ωμοπλάτη.",
  "desc_en": "Rhomboid major and minor, deep between the spine and the scapula.",
  "fn_el": "Προσαγωγή και ανύψωση της ωμοπλάτης (ώμοι προς τα πίσω).",
  "fn_en": "Retract and elevate the scapula (shoulders back)."
 },
 {
  "slug": "rectus_abdominis",
  "name_el": "Ορθός κοιλιακός",
  "name_en": "Rectus abdominis",
  "region": "core",
  "order": 40,
  "desc_el": "Κάθετος μυς του μπροστινού κορμού με τενοντώδεις διαχωρισμούς.",
  "desc_en": "Vertical muscle of the front trunk with tendinous intersections.",
  "fn_el": "Κάμψη του κορμού, σταθεροποίηση της λεκάνης.",
  "fn_en": "Trunk flexion; stabilizes the pelvis."
 },
 {
  "slug": "obliques",
  "name_el": "Λοξοί κοιλιακοί",
  "name_en": "Obliques",
  "region": "core",
  "order": 41,
  "desc_el": "Έξω και έσω λοξός κοιλιακός στα πλάγια της κοιλιάς.",
  "desc_en": "External and internal obliques on the sides of the abdomen.",
  "fn_el": "Στροφή και πλάγια κάμψη του κορμού, ενδοκοιλιακή πίεση.",
  "fn_en": "Trunk rotation and lateral flexion; intra-abdominal pressure."
 },
 {
  "slug": "serratus_anterior",
  "name_el": "Πρόσθιος οδοντωτός",
  "name_en": "Serratus anterior",
  "region": "core",
  "order": 42,
  "desc_el": "Μυς με δακτυλιοειδείς δεσμίδες από τις πλευρές στην έσω πλευρά της ωμοπλάτης.",
  "desc_en": "Muscle with finger-like slips from the ribs to the medial scapula.",
  "fn_el": "Έλξη της ωμοπλάτης προς τα εμπρός, ανοδική στροφή της, στήριξή της στον θώρακα.",
  "fn_en": "Protracts and upwardly rotates the scapula; holds it to the thorax."
 },
 {
  "slug": "erector_spinae",
  "name_el": "Ραχιαίοι (ορθωτήρες)",
  "name_en": "Erector spinae",
  "region": "core",
  "order": 43,
  "desc_el": "Ομάδα μυών κατά μήκος της σπονδυλικής στήλης (λαγονοπλευρικός, μακρύτατος, ακανθώδης).",
  "desc_en": "Group of muscles along the spine (iliocostalis, longissimus, spinalis).",
  "fn_el": "Έκταση και πλάγια κάμψη της σπονδυλικής στήλης, διατήρηση όρθιας στάσης.",
  "fn_en": "Extend and laterally flex the spine; maintain upright posture."
 },
 {
  "slug": "biceps",
  "name_el": "Δικέφαλος βραχιόνιος",
  "name_en": "Biceps brachii",
  "region": "arms",
  "order": 50,
  "desc_el": "Μυς της πρόσθιας επιφάνειας του βραχίονα με δύο κεφαλές.",
  "desc_en": "Muscle on the front of the upper arm with two heads.",
  "fn_el": "Κάμψη του αγκώνα, υπτιασμός του πήχη, ελαφρά κάμψη του ώμου.",
  "fn_en": "Elbow flexion, forearm supination, weak shoulder flexion."
 },
 {
  "slug": "triceps",
  "name_el": "Τρικέφαλος βραχιόνιος",
  "name_en": "Triceps brachii",
  "region": "arms",
  "order": 51,
  "desc_el": "Μυς της οπίσθιας επιφάνειας του βραχίονα με τρεις κεφαλές.",
  "desc_en": "Muscle on the back of the upper arm with three heads.",
  "fn_el": "Έκταση του αγκώνα. Η μακρά κεφαλή βοηθά και στην έκταση του ώμου.",
  "fn_en": "Elbow extension. The long head also assists shoulder extension."
 },
 {
  "slug": "forearms",
  "name_el": "Μύες πήχη",
  "name_en": "Forearm muscles",
  "region": "arms",
  "order": 52,
  "desc_el": "Καμπτήρες και εκτείνοντες του καρπού και των δακτύλων, πρηνιστές και υπτιαστές.",
  "desc_en": "Wrist and finger flexors and extensors, pronators and supinators.",
  "fn_el": "Κάμψη και έκταση καρπού και δακτύλων, λαβή, στροφή του πήχη.",
  "fn_en": "Wrist and finger flexion and extension, grip, forearm rotation."
 },
 {
  "slug": "gluteus_maximus",
  "name_el": "Μέγας γλουτιαίος",
  "name_en": "Gluteus maximus",
  "region": "glutes",
  "order": 60,
  "desc_el": "Ο μεγαλύτερος και πιο επιφανειακός μυς των γλουτών.",
  "desc_en": "The largest and most superficial gluteal muscle.",
  "fn_el": "Έκταση και έξω στροφή του ισχίου (ανέβασμα από κάθισμα, βάδισμα ανηφόρας).",
  "fn_en": "Hip extension and external rotation (rising from a squat, uphill walking)."
 },
 {
  "slug": "gluteus_medius",
  "name_el": "Μέσος γλουτιαίος",
  "name_en": "Gluteus medius",
  "region": "glutes",
  "order": 61,
  "desc_el": "Μυς στην πλάγια επιφάνεια της λεκάνης, κάτω από τον μέγα γλουτιαίο.",
  "desc_en": "Muscle on the lateral pelvis, partly under gluteus maximus.",
  "fn_el": "Απαγωγή του ισχίου, σταθεροποίηση της λεκάνης στη στάση σε ένα πόδι και στο βάδισμα.",
  "fn_en": "Hip abduction; pelvic stabilization in single-leg stance and walking."
 },
 {
  "slug": "gluteus_minimus",
  "name_el": "Ελάσσων γλουτιαίος",
  "name_en": "Gluteus minimus",
  "region": "glutes",
  "order": 62,
  "desc_el": "Ο βαθύτερος και μικρότερος γλουτιαίος.",
  "desc_en": "The deepest and smallest gluteal muscle.",
  "fn_el": "Απαγωγή και έσω στροφή του ισχίου, σταθεροποίηση της κεφαλής του μηριαίου.",
  "fn_en": "Hip abduction and internal rotation; stabilizes the femoral head."
 },
 {
  "slug": "quadriceps",
  "name_el": "Τετρακέφαλος μηριαίος",
  "name_en": "Quadriceps",
  "region": "thighs",
  "order": 70,
  "desc_el": "Τέσσερις μύες του πρόσθιου μηρού: ευθύς, έξω, έσω και μέσος πλατύς.",
  "desc_en": "Four muscles of the front thigh: rectus femoris and vastus lateralis, medialis, intermedius.",
  "fn_el": "Έκταση του γόνατος. Ο ευθύς μηριαίος βοηθά και στην κάμψη του ισχίου.",
  "fn_en": "Knee extension. Rectus femoris also assists hip flexion."
 },
 {
  "slug": "hamstrings",
  "name_el": "Οπίσθιοι μηριαίοι",
  "name_en": "Hamstrings",
  "region": "thighs",
  "order": 71,
  "desc_el": "Δικέφαλος μηριαίος, ημιτενοντώδης και ημιελυτρώδης στην οπίσθια επιφάνεια του μηρού.",
  "desc_en": "Biceps femoris, semitendinosus and semimembranosus on the back of the thigh.",
  "fn_el": "Κάμψη του γόνατος και έκταση του ισχίου.",
  "fn_en": "Knee flexion and hip extension."
 },
 {
  "slug": "adductors",
  "name_el": "Προσαγωγοί",
  "name_en": "Adductors",
  "region": "thighs",
  "order": 72,
  "desc_el": "Ομάδα μυών στην έσω επιφάνεια του μηρού.",
  "desc_en": "Muscle group on the inner thigh.",
  "fn_el": "Προσαγωγή του μηρού, σταθεροποίηση της λεκάνης.",
  "fn_en": "Adduct the thigh; stabilize the pelvis."
 },
 {
  "slug": "gastrocnemius",
  "name_el": "Γαστροκνήμιος",
  "name_en": "Gastrocnemius",
  "region": "lower_legs",
  "order": 80,
  "desc_el": "Επιφανειακός μυς της γάμπας με δύο κεφαλές που ξεκινούν πάνω από το γόνατο.",
  "desc_en": "Superficial calf muscle with two heads originating above the knee.",
  "fn_el": "Πελματιαία κάμψη του αστραγάλου, ελαφρά κάμψη του γόνατος.",
  "fn_en": "Ankle plantarflexion; weak knee flexion."
 },
 {
  "slug": "soleus",
  "name_el": "Υποκνήμιος (soleus)",
  "name_en": "Soleus",
  "region": "lower_legs",
  "order": 81,
  "desc_el": "Βαθύτερος μυς της γάμπας κάτω από τον γαστροκνήμιο.",
  "desc_en": "Deeper calf muscle beneath gastrocnemius.",
  "fn_el": "Πελματιαία κάμψη του αστραγάλου, ιδίως με λυγισμένο γόνατο, και στάση όρθια.",
  "fn_en": "Ankle plantarflexion, especially with a bent knee; upright standing."
 },
 {
  "slug": "tibialis_anterior",
  "name_el": "Πρόσθιος κνημιαίος",
  "name_en": "Tibialis anterior",
  "region": "lower_legs",
  "order": 82,
  "desc_el": "Μυς στην πρόσθια-έξω επιφάνεια της κνήμης.",
  "desc_en": "Muscle on the front-lateral shin.",
  "fn_el": "Ραχιαία κάμψη του αστραγάλου και ανύψωση του έσω χείλους του πέλματος.",
  "fn_en": "Dorsiflexion of the ankle and inversion of the foot."
 }
];
// Αντιστοίχιση των αδρών όρων της βιβλιοθήκης (primary_muscles/secondary_muscles) σε slugs. Fallback μέχρι να τρέξει το migration.
export const TERM_TO_SLUGS = {"Στήθος": ["pectoralis_major"], "Ώμοι": ["deltoids"], "Τρικέφαλοι": ["triceps"], "Δικέφαλοι": ["biceps"], "Πήχεις": ["forearms"], "Κοιλιακοί": ["rectus_abdominis"], "Οσφυϊκή χώρα": ["erector_spinae"], "Μέση πλάτη": ["rhomboids"], "Τραπεζοειδείς": ["trapezius"], "Πλατύς ραχιαίος": ["latissimus_dorsi"], "Τετρακέφαλοι": ["quadriceps"], "Οπίσθιοι μηροί": ["hamstrings"], "Γλουτοί": ["gluteus_maximus"], "Γάμπες": ["gastrocnemius", "soleus"], "Προσαγωγείς": ["adductors"], "Απαγωγείς": ["gluteus_medius"]};
