"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import * as THREE from "three";
import { DoubleConfirmModal } from "@/components/ui/double-confirm-modal";

// --- Types ---
type CourseItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty: string;
  price_usd: number;
  is_published: boolean;
  chapter_count: number;
  lesson_count: number;
  progress_pct: number;
  badge_criteria?: { bronze: number; copper: number; silver: number; gold: number; platinum: number };
  badge_criteria_locked?: boolean;
};

type ChapterNode = {
  id: string;
  title: string;
  x: number;
  z: number;
  y: number;
  locked: boolean;
  wallType: "cloud" | "wall" | "none";
};

type LessonNode = {
  id: string;
  chapterId: string;
  title: string;
  order_index: number;
  locked: boolean;
  type: string;
  is_graded: boolean;
};

type ContentBlock = {
  id: string;
  type: string; // heading, paragraph, image, video, code, embed, divider, callout, quiz, table, attachment
  content: string;
  properties: Record<string, any>;
};

// --- Seed Data Helper ---
const DEFAULT_CHAPTERS: ChapterNode[] = [
  { id: "ch-1", title: "Chapter 1: Getting Started", x: -8, z: -5, y: 1.5, locked: false, wallType: "none" },
  { id: "ch-2", title: "Chapter 2: Core Concepts", x: 0, z: 2, y: 0.5, locked: true, wallType: "cloud" },
  { id: "ch-3", title: "Chapter 3: Advanced Systems", x: 8, z: -3, y: 2.2, locked: true, wallType: "wall" },
];

const DEFAULT_LESSONS: LessonNode[] = [
  { id: "les-1-1", chapterId: "ch-1", title: "Welcome and Prerequisites", order_index: 1, locked: false, type: "text", is_graded: false },
  { id: "les-1-2", chapterId: "ch-1", title: "Installation & Workspace", order_index: 2, locked: true, type: "text", is_graded: false },
  { id: "les-2-1", chapterId: "ch-2", title: "Understanding Data Flow", order_index: 1, locked: true, type: "text", is_graded: false },
  { id: "les-2-2", chapterId: "ch-2", title: "State Management Core", order_index: 2, locked: true, type: "text", is_graded: false },
  { id: "les-3-1", chapterId: "ch-3", title: "Optimization Techniques", order_index: 1, locked: true, type: "text", is_graded: false },
  { id: "les-3-2", chapterId: "ch-3", title: "Final Project Review", order_index: 2, locked: true, type: "text", is_graded: false },
];

export default function CourseBuilderPage() {
  const [view, setView] = useState<"lobby" | "pathway" | "editor">("lobby");
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);

  // New Course Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Computer Science");

  // Lesson Editor Sub-view (Preview feature)
  const [editorSubView, setEditorSubView] = useState<"edit" | "preview">("edit");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({}); // Store choices made in lesson preview

  // Edit Course Details Authority modal states
  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Computer Science");
  const [editDescription, setEditDescription] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("beginner");
  const [editPriceUsd, setEditPriceUsd] = useState("0");
  const [editIsPublished, setEditIsPublished] = useState(false);
  const [editBadgeCriteria, setEditBadgeCriteria] = useState({ bronze: 50, copper: 60, silver: 70, gold: 80, platinum: 90 });
  const [editBadgeLocked, setEditBadgeLocked] = useState(false);
  const [savingCourseDetails, setSavingCourseDetails] = useState(false);

  // Double Confirm Modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmModalTitle, setConfirmModalTitle] = useState("");
  const [confirmModalDesc, setConfirmModalDesc] = useState("");
  const [confirmWord, setConfirmWord] = useState<string | undefined>(undefined);

  // 3D Pathway Map Data
  const [chapters, setChapters] = useState<ChapterNode[]>([]);
  const [lessons, setLessons] = useState<LessonNode[]>([]);
  const [activeChapter, setActiveChapter] = useState<ChapterNode | null>(null);
  const [simulationMode, setSimulationMode] = useState<"edit" | "preview">("edit");

  // Lesson Editor Data
  const [activeLesson, setActiveLesson] = useState<LessonNode | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [savingBlock, setSavingBlock] = useState(false);

  // Ref container for Three.js canvas
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshesRef = useRef<Record<string, THREE.Object3D>>({});
  const selectedNodeRef = useRef<string | null>(null);

  // --- Fetch Courses ---
  const loadCourses = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dbCourses } = await supabase
        .from("courses")
        .select("id, title, category, description, difficulty, price_usd, is_published, total_lessons, badge_criteria, badge_criteria_locked")
        .eq("coach_id", user.id);

      const items: CourseItem[] = (dbCourses ?? []).map(c => ({
        id: c.id,
        title: c.title,
        category: c.category ?? "Computer Science",
        description: c.description ?? "",
        difficulty: c.difficulty ?? "Beginner",
        price_usd: Number(c.price_usd) || 0,
        is_published: !!c.is_published,
        chapter_count: 3,
        lesson_count: c.total_lessons ?? 6,
        progress_pct: 0,
        badge_criteria: c.badge_criteria,
        badge_criteria_locked: c.badge_criteria_locked
      }));

      setCourses(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  // --- Create Course ---
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const supabase = createClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const baseSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: newCourse } = await supabase
        .from("courses")
        .insert({
          coach_id: user.id,
          title: newTitle.trim(),
          category: newCategory,
          slug,
          is_published: false,
          total_lessons: 6
        })
        .select()
        .single();

      if (newCourse) {
        // Create mock lessons in DB to enable editing
        for (let i = 0; i < DEFAULT_LESSONS.length; i++) {
          const dl = DEFAULT_LESSONS[i];
          await supabase.from("lessons").insert({
            course_id: newCourse.id,
            title: dl.title,
            order_index: dl.order_index,
            type: "text",
            content: JSON.stringify([
              { id: "b-1", type: "heading", content: `Welcome to ${dl.title}`, properties: { level: 2 } },
              { id: "b-2", type: "paragraph", content: "This is a dynamic template lesson block. Click options to edit and expand curriculum details.", properties: {} }
            ])
          });
        }
        setCreateOpen(false);
        setNewTitle("");
        void loadCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Open 3D Map ---
  const handleOpenPathway = async (course: CourseItem) => {
    setSelectedCourse(course);
    setView("pathway");
    setActiveChapter(null);

    try {
      const supabase = createClient();
      if (!supabase) throw new Error("No supabase client");

      const { data: dbChapters, error: chErr } = await supabase
        .from("chapters")
        .select("*")
        .eq("course_id", course.id)
        .order("order_index", { ascending: true });

      const { data: dbLessons, error: lesErr } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", course.id)
        .order("order_index", { ascending: true });

      if (chErr || lesErr) throw new Error("Failed to fetch chapters/lessons from DB");

      if (dbChapters && dbChapters.length > 0) {
        setChapters(dbChapters.map(ch => ({
          id: ch.id,
          title: ch.title,
          x: Number(ch.x_pos) || 0,
          z: Number(ch.z_pos) || 0,
          y: Number(ch.y_pos) || 0,
          locked: !!ch.is_locked,
          wallType: (ch.wall_type as any) || "none"
        })));
        
        setLessons((dbLessons || []).map(l => ({
          id: l.id,
          chapterId: l.chapter_id || "",
          title: l.title,
          order_index: l.order_index,
          locked: false, // Default to false if not stored
          type: l.type || "text",
          is_graded: !!l.is_graded
        })));
        return;
      }
    } catch (e) {
      console.warn("Falling back to local storage:", e);
    }

    // Load local storage custom layout for this course if it exists, or fall back to default
    const savedLayout = localStorage.getItem(`pathway-${course.id}`);
    if (savedLayout) {
      const parsed = JSON.parse(savedLayout);
      setChapters(parsed.chapters);
      setLessons(parsed.lessons);
    } else {
      setChapters(DEFAULT_CHAPTERS);
      setLessons(DEFAULT_LESSONS);
    }
  };

  // Save layout position
  const saveLayoutToLocalStorage = (updatedChapters: ChapterNode[], updatedLessons: LessonNode[]) => {
    if (!selectedCourse) return;
    localStorage.setItem(
      `pathway-${selectedCourse.id}`,
      JSON.stringify({ chapters: updatedChapters, lessons: updatedLessons })
    );
  };

  // --- Open Lesson Editor ---
  const handleOpenLesson = useCallback(async (lesson: LessonNode) => {
    setActiveLesson(lesson);
    setView("editor");
    setSelectedBlockId(null);
    setSavingBlock(false);

    try {
      const supabase = createClient();
      if (!supabase) return;

      // Fetch lesson content
      const { data: dbLessons } = await supabase
        .from("lessons")
        .select("content")
        .eq("course_id", selectedCourse!.id)
        .eq("title", lesson.title)
        .limit(1);

      if (dbLessons && dbLessons.length > 0 && dbLessons[0].content) {
        try {
          const parsed = JSON.parse(dbLessons[0].content);
          setBlocks(Array.isArray(parsed) ? parsed : []);
        } catch {
          // Fallback if content is plain text
          setBlocks([
            { id: "b-fallback", type: "paragraph", content: dbLessons[0].content, properties: {} }
          ]);
        }
      } else {
        setBlocks([
          { id: "b-1", type: "heading", content: lesson.title, properties: { level: 2 } },
          { id: "b-2", type: "paragraph", content: "Write or drag curriculum components below.", properties: {} }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedCourse]);

  // Save lesson editor content
  const handleSaveLessonContent = async () => {
    if (!activeLesson || !selectedCourse) return;
    setSavingBlock(true);

    try {
      const supabase = createClient();
      if (!supabase) return;

      // Update lesson table content
      await supabase
        .from("lessons")
        .update({ content: JSON.stringify(blocks) })
        .eq("course_id", selectedCourse.id)
        .eq("title", activeLesson.title);

      alert("Lesson content saved to cloud database!");
    } catch (err) {
      console.error(err);
      alert("Failed to save lesson content.");
    } finally {
      setSavingBlock(false);
    }
  };

  // State to track which course is currently being edited in details modal
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Open Edit Course Modal
  const openEditCourseModal = (course: CourseItem) => {
    setEditingCourseId(course.id);
    setEditTitle(course.title);
    setEditCategory(course.category);
    setEditDescription(course.description);
    setEditDifficulty(course.difficulty);
    setEditPriceUsd(String(course.price_usd));
    setEditIsPublished(course.is_published);
    setEditBadgeCriteria(course.badge_criteria || { bronze: 50, copper: 60, silver: 70, gold: 80, platinum: 90 });
    setEditBadgeLocked(!!course.badge_criteria_locked);
    setEditCourseModalOpen(true);
  };

  const handleLockBadgeCriteria = () => {
    setConfirmModalTitle("Lock Badge Criteria");
    setConfirmModalDesc("Once locked, you will not be able to change the badge threshold criteria for this course ever again.");
    setConfirmWord("LOCK");
    setConfirmAction(() => () => setEditBadgeLocked(true));
    setConfirmModalOpen(true);
  };

  // Save/Update Course Details
  const handleUpdateCourseDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourseId || !editTitle.trim()) return;
    setSavingCourseDetails(true);

    try {
      const supabase = createClient();
      if (!supabase) return;

      const { error } = await supabase
        .from("courses")
        .update({
          title: editTitle.trim(),
          category: editCategory,
          description: editDescription.trim(),
          difficulty: editDifficulty,
          price_usd: Number(editPriceUsd) || 0,
          is_published: editIsPublished,
          badge_criteria: editBadgeCriteria,
          badge_criteria_locked: editBadgeLocked
        })
        .eq("id", editingCourseId);

      if (error) throw error;

      alert("Course details updated successfully!");
      setEditCourseModalOpen(false);
      
      // Update local state if this was our currently selected course
      if (selectedCourse && selectedCourse.id === editingCourseId) {
        setSelectedCourse(prev => prev ? {
          ...prev,
          title: editTitle.trim(),
          category: editCategory,
          description: editDescription.trim(),
          difficulty: editDifficulty,
          price_usd: Number(editPriceUsd) || 0,
          is_published: editIsPublished,
          badge_criteria: editBadgeCriteria,
          badge_criteria_locked: editBadgeLocked
        } : null);
      }

      void loadCourses();
    } catch (err) {
      console.error(err);
      alert("Failed to update course details.");
    } finally {
      setSavingCourseDetails(false);
    }
  };

  // --- Three.js Game World Render Hook ---
  useEffect(() => {
    if (view !== "pathway" || !mountRef.current) return;

    // 1. Setup Scene, Camera, Renderer
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07040f);
    scene.fog = new THREE.FogExp2(0x07040f, 0.015);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    // Bird's eye angled look
    camera.position.set(0, 20, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0x221a3a, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x8a5cf5, 2.0);
    dirLight.position.set(10, 30, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Glowing point lights
    const mapLight = new THREE.PointLight(0xff5500, 2, 20);
    mapLight.position.set(0, 2, 0);
    scene.add(mapLight);

    // 3. Grid & Atmospheric Star System
    const gridHelper = new THREE.GridHelper(60, 60, 0x1f1938, 0x130e28);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Stars particle system
    const starsGeom = new THREE.BufferGeometry();
    const starsCount = 1500;
    const starPositions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 160;
      starPositions[i + 1] = Math.random() * 80 + 10;
      starPositions[i + 2] = (Math.random() - 0.5) * 160;
    }
    starsGeom.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.75
    });
    const starField = new THREE.Points(starsGeom, starsMat);
    scene.add(starField);

    // 4. Render Chapters & Lessons
    meshesRef.current = {};

    // Draw lines/energy beams connecting chapters
    const lineMat = new THREE.LineBasicMaterial({ color: 0x818cf8 });
    for (let i = 0; i < chapters.length - 1; i++) {
      const start = chapters[i];
      const end = chapters[i + 1];
      const points = [
        new THREE.Vector3(start.x, start.y, start.z),
        new THREE.Vector3(end.x, end.y, end.z)
      ];
      const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
      const energyLine = new THREE.Line(lineGeom, lineMat);
      scene.add(energyLine);
    }

    chapters.forEach((ch, idx) => {
      // Cylindrical or Hexagonal floating islands
      const geom = new THREE.CylinderGeometry(2.2, 2.5, 0.8, 6);
      const isLocked = simulationMode === "preview" && ch.locked;

      const mat = new THREE.MeshStandardMaterial({
        color: isLocked ? 0x27272a : idx === 0 ? 0xff5500 : idx === 1 ? 0x8a5cf5 : 0x06b6d4,
        roughness: 0.3,
        metalness: 0.1,
        emissive: isLocked ? 0x050505 : idx === 0 ? 0xff5500 : idx === 1 ? 0x8a5cf5 : 0x06b6d4,
        emissiveIntensity: 0.25
      });

      const island = new THREE.Mesh(geom, mat);
      island.position.set(ch.x, ch.y, ch.z);
      island.castShadow = true;
      island.receiveShadow = true;
      island.name = ch.id;
      scene.add(island);
      meshesRef.current[ch.id] = island;

      // Glow Ring underneath
      const ringGeom = new THREE.RingGeometry(2.3, 2.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0xffaa00 : idx === 1 ? 0xa855f7 : 0x22d3ee,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const glowRing = new THREE.Mesh(ringGeom, ringMat);
      glowRing.rotation.x = Math.PI / 2;
      glowRing.position.y = -0.41;
      island.add(glowRing);

      // Physical cloud/wall divider sitting next to platform (if matching status)
      if (ch.wallType !== "none") {
        if (ch.wallType === "cloud") {
          // Cloud barriers
          const cloudGroup = new THREE.Group();
          const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.9 });
          for (let c = 0; c < 4; c++) {
            const ballGeom = new THREE.SphereGeometry(0.8 + Math.random()*0.4, 8, 8);
            const ball = new THREE.Mesh(ballGeom, cloudMat);
            ball.position.set((Math.random()-0.5)*2, 0.4, (Math.random()-0.5)*2);
            cloudGroup.add(ball);
          }
          cloudGroup.position.set(ch.x - 3.5, ch.y, ch.z - 1.5);
          scene.add(cloudGroup);
        } else {
          // Wall barrier
          const wallGeom = new THREE.BoxGeometry(4, 2, 0.6);
          const wallMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.8 });
          const wall = new THREE.Mesh(wallGeom, wallMat);
          wall.position.set(ch.x - 3.5, ch.y + 0.6, ch.z - 1.5);
          scene.add(wall);
        }

        // Floating Lock Indicator over barrier
        if (isLocked) {
          const lockGeom = new THREE.TorusGeometry(0.4, 0.15, 8, 24);
          const lockMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.6 });
          const lockMesh = new THREE.Mesh(lockGeom, lockMat);
          lockMesh.position.set(ch.x - 3.5, ch.y + 1.8, ch.z - 1.5);
          scene.add(lockMesh);
        }
      }

      // Render Lessons on/around chapter
      const chapterLessons = lessons.filter(l => l.chapterId === ch.id);
      chapterLessons.forEach((les, lesIdx) => {
        const theta = (lesIdx / chapterLessons.length) * Math.PI * 2;
        const radius = 1.3;
        const lx = Math.cos(theta) * radius;
        const lz = Math.sin(theta) * radius;

        const lesLocked = simulationMode === "preview" && les.locked;
        const orbGeom = new THREE.SphereGeometry(0.35, 16, 16);
        const orbMat = new THREE.MeshStandardMaterial({
          color: lesLocked ? 0x52525b : 0x10b981,
          roughness: 0.1,
          metalness: 0.8,
          emissive: lesLocked ? 0x0a0a0a : 0x10b981,
          emissiveIntensity: 0.8
        });

        const orb = new THREE.Mesh(orbGeom, orbMat);
        orb.position.set(lx, 0.8, lz);
        orb.name = `lesson:${les.id}`;
        island.add(orb);
      });
    });

    // 5. Animation Render Loop
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Floating sine wave animation for chapters
      Object.keys(meshesRef.current).forEach((key, idx) => {
        const mesh = meshesRef.current[key];
        mesh.position.y = chapters[idx].y + Math.sin(elapsed * 1.5 + idx) * 0.15;
        // Slow rotation spin
        mesh.rotation.y = elapsed * 0.05 + idx * 0.1;
      });

      // Slowly rotate background stars
      starField.rotation.y = elapsed * 0.008;

      renderer.render(scene, camera);
    };
    void animate();

    // 6. Interaction Raycasting (Click handling & dragging)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        let hitObject = intersects[0].object;
        
        // Traverse up to find parent if clicked child component
        while (hitObject.parent && hitObject.parent !== scene && !hitObject.name) {
          hitObject = hitObject.parent as THREE.Object3D;
        }

        const name = hitObject.name;
        if (!name) return;

        // Lesson click check
        if (name.startsWith("lesson:")) {
          const lessonId = name.replace("lesson:", "");
          const targetLesson = lessons.find(l => l.id === lessonId);
          if (targetLesson) {
            // Check Lock
            if (simulationMode === "preview" && targetLesson.locked) {
              alert("This lesson node is currently locked! Complete the previous lesson platform first.");
              return;
            }
            void handleOpenLesson(targetLesson);
          }
        } else {
          // Chapter node click zoom fly-in
          const targetCh = chapters.find(c => c.id === name);
          if (targetCh) {
            if (simulationMode === "preview" && targetCh.locked) {
              alert("This chapter platform is locked by a physical barrier cloud/wall.");
              return;
            }

            setActiveChapter(targetCh);
            selectedNodeRef.current = targetCh.id;

            // Camera Fly-In Zoom transition
            const targetPos = new THREE.Vector3(targetCh.x, targetCh.y + 4.5, targetCh.z + 5.5);
            
            // Fast slide animation
            let progress = 0;
            const camFly = () => {
              if (progress < 1) {
                progress += 0.08;
                camera.position.lerp(targetPos, 0.15);
                camera.lookAt(targetCh.x, targetCh.y, targetCh.z);
                requestAnimationFrame(camFly);
              }
            };
            void camFly();
          }
        }
      }
    };

    renderer.domElement.addEventListener("click", handleCanvasClick);

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [view, chapters, lessons, simulationMode, handleOpenLesson]);

  // --- Add Chapter Node ---
  const handleAddChapterNode = () => {
    const nextId = `ch-${chapters.length + 1}`;
    const newCh: ChapterNode = {
      id: nextId,
      title: `Chapter ${chapters.length + 1}: Custom Module`,
      x: (Math.random() - 0.5) * 14,
      z: (Math.random() - 0.5) * 14,
      y: 1.0 + Math.random() * 1.5,
      locked: true,
      wallType: "cloud"
    };

    const newLessons: LessonNode[] = [
      { id: `les-${nextId}-1`, chapterId: nextId, title: `Lesson ${chapters.length + 1}.1`, order_index: 1, locked: true }
    ];

    const updatedChs = [...chapters, newCh];
    const updatedLes = [...lessons, ...newLessons];

    setChapters(updatedChs);
    setLessons(updatedLes);
    saveLayoutToLocalStorage(updatedChs, updatedLes);
  };

  // --- Add Lesson Node ---
  const handleAddLesson = () => {
    if (!activeChapter) return;
    const nextLesIdx = lessons.filter(l => l.chapterId === activeChapter.id).length + 1;
    const newLes: LessonNode = {
      id: `les-${activeChapter.id}-${nextLesIdx}`,
      chapterId: activeChapter.id,
      title: `Lesson ${nextLesIdx} (Mini Activity)`,
      order_index: nextLesIdx,
      locked: true,
      type: "mini_activity",
      is_graded: false
    };

    const updatedLes = [...lessons, newLes];
    setLessons(updatedLes);
    saveLayoutToLocalStorage(chapters, updatedLes);
  };

  // --- Drag Reposition nodes (Simulated in list editor for mouse-friendly precision) ---
  const handleUpdatePosition = (id: string, field: "x" | "z" | "y", val: number) => {
    const updated = chapters.map(ch => {
      if (ch.id === id) {
        return { ...ch, [field]: val };
      }
      return ch;
    });
    setChapters(updated);
    saveLayoutToLocalStorage(updated, lessons);
  };

  // Toggle node lock status
  const handleToggleLock = (id: string, type: "chapter" | "lesson") => {
    if (type === "chapter") {
      const updated = chapters.map(ch => (ch.id === id ? { ...ch, locked: !ch.locked } : ch));
      setChapters(updated);
      saveLayoutToLocalStorage(updated, lessons);
    } else {
      const updated = lessons.map(l => (l.id === id ? { ...l, locked: !l.locked } : l));
      setLessons(updated);
      saveLayoutToLocalStorage(chapters, updated);
    }
  };

  // Toggle cloud/wall type
  const handleCycleWall = (id: string) => {
    const updated = chapters.map(ch => {
      if (ch.id === id) {
        const nextWall = ch.wallType === "none" ? "cloud" : ch.wallType === "cloud" ? "wall" : "none";
        return { ...ch, wallType: nextWall as any };
      }
      return ch;
    });
    setChapters(updated);
    saveLayoutToLocalStorage(updated, lessons);
  };

  // --- Drag-and-drop block functions ---
  const handleAddBlock = (type: string) => {
    const newBlock: ContentBlock = {
      id: `b-${Date.now()}`,
      type,
      content:
        type === "heading"
          ? "New Section Header"
          : type === "code"
          ? 'console.log("Hello Dynamic World");'
          : type === "embed"
          ? "https://wikipedia.org"
          : type === "callout"
          ? "💡 Important instructional alert content..."
          : type === "quiz"
          ? "Select the correct output value."
          : `Editable block of type ${type}...`,
      properties:
        type === "heading"
          ? { level: 2 }
          : type === "quiz"
          ? { options: ["Option A", "Option B", "Option C"], answer: "Option A" }
          : {}
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const handleUpdateBlockContent = (id: string, content: string) => {
    setBlocks(prev => prev.map(b => (b.id === id ? { ...b, content } : b)));
  };

  const handleUpdateBlockProp = (id: string, key: string, val: any) => {
    setBlocks(prev =>
      prev.map(b => (b.id === id ? { ...b, properties: { ...b.properties, [key]: val } } : b))
    );
  };

  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= blocks.length) return;

    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[swap];
    copy[swap] = temp;
    setBlocks(copy);
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  return (
    <div className="min-h-screen bg-[#07040f] text-white flex flex-col font-sans">
      {/* Visual Navigation Bar */}
      <header className="border-b border-[#221740] bg-[#0c081d] px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-indigo-400 bg-clip-text text-transparent tracking-wider">
            COGNARA CREATOR™
          </span>
          <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold text-violet-400 border border-violet-500/35 uppercase">
            3D Platform
          </span>
        </div>
        <div className="flex items-center gap-3">
          {view !== "lobby" && (
            <button
              onClick={() => setView("lobby")}
              className="rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2 text-xs font-bold text-gray-300 hover:bg-[#1a113d] hover:text-white transition"
            >
              ← Exit to Lobby
            </button>
          )}
          <Link
            href="/coach/courses"
            className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white hover:bg-violet-700 transition"
          >
            Coach Dashboard
          </Link>
        </div>
      </header>

      {/* --- LAYER 1: COURSE LOBBY DASHBOARD --- */}
      {view === "lobby" && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-8 flex flex-col gap-8">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Course Pathway Builder</h1>
              <p className="mt-1 text-sm text-gray-400">Design dynamic 3D paths, chapter lock gates, and lesson content modules.</p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 hover:shadow-lg"
            >
              + Create New Course
            </button>
          </section>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-44 bg-[#110c2c] border border-[#201540] animate-pulse rounded-2xl" />
              <div className="h-44 bg-[#110c2c] border border-[#201540] animate-pulse rounded-2xl" />
            </div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#221740] bg-[#0c081d] py-16 text-center">
              <h2 className="text-lg font-bold text-white">No builder courses</h2>
              <p className="mt-1 text-sm text-gray-400 max-w-sm">Create a course above to initialize the 3D map environment.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-[#221740] bg-[#0c081d] p-5 shadow-lg relative overflow-hidden transition-all duration-300 hover:border-violet-500/40 hover:-translate-y-1 hover:shadow-violet-900/10"
                >
                  <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full blur-xl" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{course.category}</span>
                  <h3 className="mt-1 text-base font-bold text-white truncate">{course.title}</h3>

                  <div className="grid grid-cols-2 gap-3 my-4">
                    <div className="rounded-xl bg-[#120c2b] p-3 text-center border border-[#1f163f]">
                      <p className="text-lg font-bold text-white">{course.chapter_count}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Chapters</p>
                    </div>
                    <div className="rounded-xl bg-[#120c2b] p-3 text-center border border-[#1f163f]">
                      <p className="text-lg font-bold text-white">{course.lesson_count}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Lessons</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenPathway(course)}
                      className="flex-1 rounded-xl bg-violet-600/80 py-2.5 text-xs font-bold text-white hover:bg-violet-700 transition"
                    >
                      3D Map →
                    </button>
                    <button
                      onClick={() => openEditCourseModal(course)}
                      className="rounded-xl border border-[#221740] bg-[#120c2b] px-3.5 py-2.5 text-xs font-bold text-gray-300 hover:border-indigo-500/50 hover:bg-[#1a113d] hover:text-white transition"
                    >
                      ⚙️ Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Modal */}
          {createOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-2xl border border-[#221740] bg-[#0c081d] p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between border-b border-[#221740] pb-3">
                  <h2 className="text-lg font-bold text-white">Create Builder Course</h2>
                  <button onClick={() => setCreateOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Course Title</label>
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={200}
                      placeholder="e.g. Intro to 3D Shader Math"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Design">Design</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-3 border-t border-[#221740]">
                    <button
                      type="button"
                      onClick={() => setCreateOpen(false)}
                      className="rounded-xl border border-[#221740] px-4 py-2 text-xs text-white"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white">
                      Initialize Layout
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Course Details Modal */}
          {editCourseModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl border border-[#221740] bg-[#0c081d] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between border-b border-[#221740] pb-3">
                  <h2 className="text-lg font-bold text-white">Edit Course Details</h2>
                  <button onClick={() => setEditCourseModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleUpdateCourseDetails} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Course Title</label>
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={200}
                      placeholder="e.g. Intro to 3D Shader Math"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe what students will learn in this course..."
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2.5 text-sm text-white focus:outline-none"
                      >
                        <option value="Computer Science">Computer Science</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Design">Design</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Difficulty</label>
                      <select
                        value={editDifficulty}
                        onChange={(e) => setEditDifficulty(e.target.value)}
                        className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2.5 text-sm text-white focus:outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Price (USD)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={editPriceUsd}
                        onChange={(e) => setEditPriceUsd(e.target.value)}
                        className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Publication Status</label>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="editIsPublished"
                          checked={editIsPublished}
                          onChange={(e) => setEditIsPublished(e.target.checked)}
                          className="h-4 w-4 rounded border-[#221740] bg-[#120c2b] text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="editIsPublished" className="text-sm text-gray-300">Publish immediately</label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Badge Criteria Section */}
                  <div className="pt-4 border-t border-[#221740]">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-bold uppercase text-gray-400">Chapter Badge Thresholds (%)</label>
                      {!editBadgeLocked ? (
                        <button
                          type="button"
                          onClick={handleLockBadgeCriteria}
                          className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-1 rounded font-bold hover:bg-amber-500/20 transition-colors"
                        >
                          🔒 Lock Criteria
                        </button>
                      ) : (
                        <span className="text-[10px] text-red-400 font-bold px-2 py-1 flex items-center gap-1">
                          🔒 Locked (Cannot change)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {["bronze", "copper", "silver", "gold", "platinum"].map((badge) => (
                        <div key={badge}>
                          <span className={`block text-[9px] font-bold uppercase mb-1 text-center ${
                            badge === 'bronze' ? 'text-orange-700' :
                            badge === 'copper' ? 'text-orange-500' :
                            badge === 'silver' ? 'text-gray-300' :
                            badge === 'gold' ? 'text-yellow-400' :
                            'text-cyan-300'
                          }`}>{badge}</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            disabled={editBadgeLocked}
                            value={editBadgeCriteria[badge as keyof typeof editBadgeCriteria] || 0}
                            onChange={(e) => setEditBadgeCriteria(prev => ({...prev, [badge]: Number(e.target.value)}))}
                            className="w-full rounded-lg border border-[#221740] bg-[#120c2b] px-2 py-1.5 text-xs text-center text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-[#221740]">
                    <button
                      type="button"
                      onClick={() => setEditCourseModalOpen(false)}
                      className="rounded-xl border border-[#221740] px-4 py-2 text-xs text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingCourseDetails}
                      className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {savingCourseDetails ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      )}

      {/* --- LAYER 2: 3D PATHWAY MAP VIEW --- */}
      {view === "pathway" && selectedCourse && (
        <main className="flex-1 flex relative overflow-hidden">
          {/* Three.js canvas mount wrapper */}
          <div ref={mountRef} className="absolute inset-0 z-0" />

          {/* Overlays / Control Panel */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-3 max-w-xs w-full pointer-events-auto">
            <div className="rounded-2xl border border-[#221740] bg-[#0c081d]/85 backdrop-blur-md p-4 shadow-xl">
              <h2 className="text-sm font-bold text-white truncate">{selectedCourse.title}</h2>
              <p className="text-[10px] text-gray-400 mt-0.5">Click chapter platform to view nested lesson nodes.</p>

              {/* Simulation Toggler */}
              <div className="mt-4 flex rounded-xl bg-[#120c2b] p-1 border border-[#221740]">
                <button
                  onClick={() => setSimulationMode("edit")}
                  className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    simulationMode === "edit" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Edit Coordinates
                </button>
                <button
                  onClick={() => setSimulationMode("preview")}
                  className={`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    simulationMode === "preview" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                  }`}
                >
                  Preview Progress
                </button>
              </div>
            </div>

            {/* Platform Positioning Editor */}
            {simulationMode === "edit" && (
              <div className="rounded-2xl border border-[#221740] bg-[#0c081d]/85 backdrop-blur-md p-4 shadow-xl max-h-[350px] overflow-y-auto">
                <div className="flex items-center justify-between mb-3 border-b border-[#221740] pb-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Chapters Node Editor</h3>
                  <button
                    onClick={handleAddChapterNode}
                    className="text-[9px] font-bold text-white bg-indigo-600/50 hover:bg-indigo-600 px-2 py-0.5 rounded border border-indigo-500/25"
                  >
                    + Add Chapter
                  </button>
                </div>
                <div className="space-y-4">
                  {chapters.map(ch => (
                    <div key={ch.id} className="border-b border-[#221740]/50 pb-3 last:border-0 last:pb-0">
                      <p className="text-[10px] font-bold text-white truncate">{ch.title}</p>
                      <div className="grid grid-cols-3 gap-1 mt-1 text-[9px]">
                        <div>
                          <span>X position</span>
                          <input
                            type="number"
                            step="0.5"
                            value={ch.x}
                            onChange={(e) => handleUpdatePosition(ch.id, "x", Number(e.target.value))}
                            className="w-full rounded bg-[#120c2b] text-white px-1.5 py-0.5 border border-[#221740]"
                          />
                        </div>
                        <div>
                          <span>Z position</span>
                          <input
                            type="number"
                            step="0.5"
                            value={ch.z}
                            onChange={(e) => handleUpdatePosition(ch.id, "z", Number(e.target.value))}
                            className="w-full rounded bg-[#120c2b] text-white px-1.5 py-0.5 border border-[#221740]"
                          />
                        </div>
                        <div>
                          <span>Y elevation</span>
                          <input
                            type="number"
                            step="0.1"
                            value={ch.y}
                            onChange={(e) => handleUpdatePosition(ch.id, "y", Number(e.target.value))}
                            className="w-full rounded bg-[#120c2b] text-white px-1.5 py-0.5 border border-[#221740]"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[9px] text-gray-400">
                        <button
                          onClick={() => handleCycleWall(ch.id)}
                          className="hover:text-white capitalize"
                        >
                          Barrier: {ch.wallType}
                        </button>
                        <button
                          onClick={() => handleToggleLock(ch.id, "chapter")}
                          className={`hover:text-white ${ch.locked ? "text-rose-400" : "text-emerald-400"}`}
                        >
                          {ch.locked ? "Locked" : "Unlocked"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Chapter/Lesson List overlay */}
          {activeChapter && (
            <div className="absolute top-4 right-4 z-10 w-64 rounded-2xl border border-[#221740] bg-[#0c081d]/85 backdrop-blur-md p-4 shadow-xl pointer-events-auto max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#221740] pb-2 mb-3">
                <h3 className="text-[11px] font-bold text-white truncate">{activeChapter.title}</h3>
                <button
                  onClick={() => setActiveChapter(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Lessons Curriculum</p>
                  <button onClick={handleAddLesson} className="text-[9px] font-bold text-white bg-emerald-600/50 hover:bg-emerald-600 px-2 py-0.5 rounded border border-emerald-500/25">
                    + Add Lesson
                  </button>
                </div>
                {lessons
                  .filter(l => l.chapterId === activeChapter.id)
                  .map(lesson => {
                    const isLocked = simulationMode === "preview" && lesson.locked;
                    return (
                      <div
                        key={lesson.id}
                        className={`rounded-xl border p-3 flex items-center justify-between gap-2 transition-all ${
                          isLocked
                            ? "border-[#221740] bg-[#110c2c]/40 opacity-60"
                            : "border-[#221740] bg-[#120c2b] hover:border-violet-500/50 cursor-pointer"
                        }`}
                        onClick={() => !isLocked && handleOpenLesson(lesson)}
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{lesson.title}</p>
                          <p className="text-[9px] text-gray-400">Lesson {lesson.order_index} {lesson.is_graded && <span className="text-emerald-400 font-bold">• Graded</span>}</p>
                        </div>
                        {isLocked ? (
                          <span className="text-xs">🔒</span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLock(lesson.id, "lesson");
                            }}
                            className="text-[9px] text-indigo-400 hover:underline"
                          >
                            Lock
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </main>
      )}

      {/* --- LAYER 3: GLASSMORPHIC DRAG-AND-DROP LESSON EDITOR --- */}
      {view === "editor" && activeLesson && (
        <main className="flex-1 flex bg-[#030107] overflow-hidden">
          {/* Draggable Blocks Sidebar */}
          {editorSubView === "edit" && (
            <section className="w-64 border-r border-[#221740] bg-[#0c081d]/90 flex flex-col p-4 overflow-y-auto shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4 border-b border-[#221740] pb-2">
                Draggable Modules
              </h3>
              <div className="space-y-2.5">
                {[
                  { type: "heading", label: "Heading Block", icon: "H" },
                  { type: "paragraph", label: "Paragraph Block", icon: "¶" },
                  { type: "image", label: "Image Embed", icon: "🖼" },
                  { type: "video", label: "Video player", icon: "🎬" },
                  { type: "code", label: "Code Block", icon: "</>" },
                  { type: "embed", label: "URL iFrame", icon: "🌐" },
                  { type: "divider", label: "Line Divider", icon: "—" },
                  { type: "callout", label: "Callout Banner", icon: "💡" },
                  { type: "quiz", label: "Multiple Choice", icon: "❓" }
                ].map(module => (
                  <div
                    key={module.type}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", module.type)}
                    onClick={() => handleAddBlock(module.type)}
                    className="rounded-xl border border-[#221740] bg-[#120c2b] p-3 text-xs font-semibold text-gray-300 hover:border-indigo-500/50 hover:bg-[#1a113d] hover:text-white transition flex items-center gap-3 cursor-grab active:cursor-grabbing"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-[10px] text-indigo-400 font-bold border border-indigo-500/30">
                      {module.icon}
                    </span>
                    <span>{module.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[10px] text-gray-400 text-center leading-relaxed">
                Drag modules onto canvas or click to add them directly.
              </p>
            </section>
          )}

          {/* Interactive Canvas */}
          <section
            className="flex-1 p-8 overflow-y-auto flex flex-col gap-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const type = e.dataTransfer.getData("text/plain");
              if (type) handleAddBlock(type);
            }}
          >
            <div className="flex items-center justify-between border-b border-[#221740] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Lesson Workspace</span>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-bold text-white">{activeLesson.title}</h1>
                  {editorSubView === "edit" && (
                    <label className="flex items-center gap-2 cursor-pointer ml-2 bg-[#120c2b] px-2 py-1 rounded-lg border border-[#221740]">
                      <input 
                        type="checkbox" 
                        checked={activeLesson.is_graded} 
                        onChange={(e) => {
                          const val = e.target.checked;
                          setActiveLesson({...activeLesson, is_graded: val});
                          const updatedLes = lessons.map(l => l.id === activeLesson.id ? {...l, is_graded: val} : l);
                          setLessons(updatedLes);
                          saveLayoutToLocalStorage(chapters, updatedLes);
                        }}
                        className="h-3 w-3 rounded border-[#221740] bg-[#120c2b] text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Graded Activity</span>
                    </label>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Mode Selector Toggle */}
                <div className="flex rounded-xl bg-[#120c2b] p-1 border border-[#221740]">
                  <button
                    onClick={() => {
                      setEditorSubView("edit");
                      setQuizAnswers({});
                    }}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      editorSubView === "edit" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Edit Mode
                  </button>
                  <button
                    onClick={() => setEditorSubView("preview")}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                      editorSubView === "preview" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Preview Mode
                  </button>
                </div>

                {editorSubView === "edit" && (
                  <button
                    onClick={handleSaveLessonContent}
                    disabled={savingBlock}
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {savingBlock ? "Saving..." : "Save Lesson"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setView("pathway");
                    setEditorSubView("edit");
                    setQuizAnswers({});
                  }}
                  className="rounded-xl border border-[#221740] bg-[#120c2b] px-4 py-2 text-xs text-white hover:bg-[#1a113d]"
                >
                  ← Back to Map
                </button>
              </div>
            </div>

            {editorSubView === "preview" ? (
              <div className="space-y-6 max-w-2xl w-full mx-auto bg-[#0a061b]/80 border border-[#201540] rounded-3xl p-8 shadow-2xl">
                {/* Student View Mock Header */}
                <div className="border-b border-[#221740] pb-6 mb-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Student Course Mode</span>
                    <h2 className="text-xl font-bold text-white mt-1">{activeLesson.title}</h2>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2.5 py-1 rounded-full text-emerald-400 font-bold border border-emerald-500/30">
                    ✓ Active
                  </span>
                </div>

                {blocks.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-400">No content modules inside this lesson yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {blocks.map((block) => {
                      return (
                        <div key={block.id} className="transition-all duration-300">
                          {/* Heading Block Preview */}
                          {block.type === "heading" && (
                            (() => {
                              const level = block.properties.level || 2;
                              if (level === 1) return <h1 className="text-2xl font-bold text-white border-b border-[#221740]/60 pb-2 mt-4">{block.content}</h1>;
                              if (level === 3) return <h3 className="text-base font-bold text-gray-200 mt-2">{block.content}</h3>;
                              return <h2 className="text-xl font-bold text-white mt-3">{block.content}</h2>;
                            })()
                          )}

                          {/* Paragraph Block Preview */}
                          {block.type === "paragraph" && (
                            <p 
                              className="text-sm text-gray-300 leading-relaxed"
                              style={{ textAlign: block.properties.align || "left" }}
                            >
                              {block.content}
                            </p>
                          )}

                          {/* Code Block Preview */}
                          {block.type === "code" && (
                            <div className="relative group">
                              <span className="absolute top-2.5 right-3 text-[9px] font-bold text-gray-500 uppercase tracking-wider">code preview</span>
                              <pre className="bg-[#030107] border border-[#221740] p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto">
                                <code>{block.content}</code>
                              </pre>
                            </div>
                          )}

                          {/* Image Block Preview */}
                          {block.type === "image" && (
                            block.content && block.content.startsWith("http") ? (
                              <div className="rounded-2xl overflow-hidden border border-[#221740] bg-black/40 flex items-center justify-center max-h-[400px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={block.content} alt="Lesson visual module" className="max-h-[400px] object-contain w-full" />
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-[#221740] p-4 text-center text-xs text-gray-500 italic">
                                [Image visual placeholder - edit URL to display]
                              </div>
                            )
                          )}

                          {/* Video Block Preview */}
                          {block.type === "video" && (
                            block.content && block.content.startsWith("http") ? (
                              <div className="rounded-2xl overflow-hidden border border-[#221740] bg-black/40">
                                <video src={block.content} controls className="w-full max-h-[350px] object-contain" />
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-[#221740] p-4 text-center text-xs text-gray-500 italic">
                                [Video player placeholder - edit URL to display]
                              </div>
                            )
                          )}

                          {/* Embed Block Preview */}
                          {block.type === "embed" && (
                            block.content && block.content.startsWith("http") ? (
                              <iframe src={block.content} className="w-full h-80 rounded-2xl border border-[#221740] shadow-md" />
                            ) : (
                              <div className="rounded-xl border border-dashed border-[#221740] p-4 text-center text-xs text-gray-500 italic">
                                [Iframe link preview placeholder - edit URL to display]
                              </div>
                            )
                          )}

                          {/* Callout Block Preview */}
                          {block.type === "callout" && (
                            <div className="bg-indigo-500/10 border-l-4 border-indigo-500 p-4 rounded-r-xl flex gap-3 items-start">
                              <span className="text-lg">💡</span>
                              <p className="text-sm text-gray-300 font-medium leading-relaxed">{block.content}</p>
                            </div>
                          )}

                          {/* Quiz Block Preview */}
                          {block.type === "quiz" && (
                            <div className="bg-[#120c2b]/70 border border-[#221740] rounded-2xl p-5 space-y-4">
                              <div>
                                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Lesson Checkpoint Quiz</span>
                                <h4 className="text-sm font-bold text-white mt-1">{block.content}</h4>
                              </div>
                              <div className="grid gap-2">
                                {(block.properties.options || []).map((opt: string, oIdx: number) => {
                                  const isSelected = quizAnswers[block.id] === opt;
                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      onClick={() => setQuizAnswers(prev => ({ ...prev, [block.id]: opt }))}
                                      className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold transition ${
                                        isSelected
                                          ? "bg-indigo-600 border-indigo-500 text-white"
                                          : "border-[#221740] bg-[#120c2b] text-gray-300 hover:border-violet-500/40 hover:text-white"
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              {quizAnswers[block.id] && (
                                <div className={`p-3 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                                  quizAnswers[block.id] === block.properties.answer
                                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                                    : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                                }`}>
                                  <span>
                                    {quizAnswers[block.id] === block.properties.answer ? "✅" : "❌"}
                                  </span>
                                  <span>
                                    {quizAnswers[block.id] === block.properties.answer
                                      ? "Correct! You got the right answer."
                                      : `Incorrect. The correct answer is: ${block.properties.answer}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Divider Block Preview */}
                          {block.type === "divider" && (
                            <div className="border-t border-[#221740]/60 my-4 w-full" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : blocks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#221740] rounded-2xl py-24 text-center">
                <p className="font-semibold text-gray-300">Drag or click blocks to begin drafting content.</p>
                <p className="text-xs text-gray-400 mt-1">Image, video, iframe, headers, markdown support included.</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl w-full mx-auto">
                {blocks.map((block, idx) => {
                  const isSelected = selectedBlockId === block.id;
                  return (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`relative rounded-2xl border p-5 backdrop-blur-md shadow-xl transition-all duration-300 ${
                        isSelected
                          ? "border-violet-500 bg-[#160e33]/70 ring-1 ring-violet-500/30"
                          : "border-[#221740] bg-[#0c081d]/50 hover:border-violet-500/30"
                      }`}
                    >
                      {/* Floating Toolbar on Selected Card */}
                      {isSelected && (
                        <div className="absolute -top-3.5 right-4 z-10 flex gap-1 bg-[#120c2b] border border-violet-500 rounded-lg p-0.5 shadow-lg">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveBlock(idx, "up")}
                            className="h-6 px-2 text-[9px] font-bold text-gray-300 hover:text-white hover:bg-[#1e1347] rounded disabled:opacity-30"
                          >
                            ▲ Up
                          </button>
                          <button
                            disabled={idx === blocks.length - 1}
                            onClick={() => handleMoveBlock(idx, "down")}
                            className="h-6 px-2 text-[9px] font-bold text-gray-300 hover:text-white hover:bg-[#1e1347] rounded disabled:opacity-30"
                          >
                            ▼ Down
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="h-6 px-2 text-[9px] font-bold text-rose-400 hover:text-white hover:bg-rose-600 rounded"
                          >
                            ✕ Delete
                          </button>
                        </div>
                      )}

                      {/* Header block render */}
                      {block.type === "heading" && (
                        <input
                          type="text"
                          value={block.content}
                          onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                          className="w-full bg-transparent text-xl font-bold text-white focus:outline-none focus:border-b focus:border-violet-500 pb-1"
                        />
                      )}

                      {/* Paragraph block render */}
                      {block.type === "paragraph" && (
                        <textarea
                          rows={3}
                          value={block.content}
                          onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                          className="w-full bg-transparent text-sm text-gray-300 focus:outline-none focus:border-b focus:border-violet-500 resize-y"
                        />
                      )}

                      {/* Code Block render */}
                      {block.type === "code" && (
                        <div className="space-y-2">
                          <textarea
                            rows={4}
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full bg-[#030107] text-xs font-mono text-emerald-400 p-3 rounded-lg border border-[#221740] focus:outline-none focus:border-violet-500"
                          />
                        </div>
                      )}

                      {/* Image render inline */}
                      {block.type === "image" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Image URL</label>
                          <input
                            type="text"
                            placeholder="Paste image link here..."
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                          {block.content && block.content.startsWith("http") ? (
                            <div className="rounded-xl overflow-hidden border border-[#221740] bg-black/40 max-h-[300px] flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={block.content} alt="Preview inline" className="max-h-[300px] object-contain" />
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No image URL pasted yet.</p>
                          )}
                        </div>
                      )}

                      {/* Video render inline */}
                      {block.type === "video" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Video URL (direct mp4 or stream link)</label>
                          <input
                            type="text"
                            placeholder="Paste video link here..."
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                          {block.content && block.content.startsWith("http") ? (
                            <div className="rounded-xl overflow-hidden border border-[#221740] bg-black/40 max-h-[300px]">
                              <video src={block.content} controls className="w-full max-h-[300px] object-contain" />
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No video URL pasted yet.</p>
                          )}
                        </div>
                      )}

                      {/* URL embed iframe inline */}
                      {block.type === "embed" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Embed URL (Iframe window)</label>
                          <input
                            type="text"
                            placeholder="Paste website link here..."
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                          />
                          {block.content && block.content.startsWith("http") ? (
                            <iframe src={block.content} className="w-full h-80 rounded-xl border border-[#221740]" />
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No URL embed pasted yet.</p>
                          )}
                        </div>
                      )}

                      {/* Callout box */}
                      {block.type === "callout" && (
                        <div className="bg-indigo-500/10 border-l-4 border-indigo-500 p-3 rounded-r-xl">
                          <textarea
                            rows={2}
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full bg-transparent text-sm text-gray-300 focus:outline-none focus:border-b focus:border-violet-500 resize-none font-medium"
                          />
                        </div>
                      )}

                      {/* Quiz Multiple Choice */}
                      {block.type === "quiz" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-bold">Quiz Question</label>
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                            className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none focus:border-b focus:border-violet-500 pb-1"
                          />
                          <div className="space-y-2">
                            {(block.properties.options || []).map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const opts = [...(block.properties.options || [])];
                                    opts[oIdx] = e.target.value;
                                    handleUpdateBlockProp(block.id, "options", opts);
                                  }}
                                  className="flex-1 rounded-lg border border-[#221740] bg-[#120c2b] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateBlockProp(block.id, "answer", opt)}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition ${
                                    block.properties.answer === opt
                                      ? "bg-emerald-600 text-white"
                                      : "border border-[#221740] text-gray-400 hover:text-white"
                                  }`}
                                >
                                  Correct
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Divider */}
                      {block.type === "divider" && (
                        <div className="border-t border-[#221740] my-3 w-full" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Selected Block properties sidebar */}
          {editorSubView === "edit" && (
            <section className="w-64 border-l border-[#221740] bg-[#0c081d]/90 flex flex-col p-4 overflow-y-auto shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-4 border-b border-[#221740] pb-2">
                Block Properties
              </h3>
              {selectedBlockId ? (
                (() => {
                  const sel = blocks.find(b => b.id === selectedBlockId);
                  if (!sel) return <p className="text-xs text-gray-400 italic">No block selected.</p>;
                  return (
                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Block Type</span>
                        <p className="mt-1 font-mono font-bold capitalize text-white bg-[#120c2b] border border-[#221740] px-2.5 py-1.5 rounded-lg">
                          {sel.type}
                        </p>
                      </div>

                      {/* Conditional properties based on type */}
                      {sel.type === "heading" && (
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Heading Level</span>
                          <select
                            value={sel.properties.level || 2}
                            onChange={(e) => handleUpdateBlockProp(sel.id, "level", Number(e.target.value))}
                            className="w-full mt-1.5 rounded-xl border border-[#221740] bg-[#120c2b] px-3 py-2 text-white outline-none"
                          >
                            <option value={1}>H1 Title</option>
                            <option value={2}>H2 Section</option>
                            <option value={3}>H3 Subsection</option>
                          </select>
                        </div>
                      )}

                      {sel.type === "paragraph" && (
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Alignment</span>
                          <div className="flex gap-1 mt-1.5">
                            {["left", "center", "right"].map(align => (
                              <button
                                key={align}
                                onClick={() => handleUpdateBlockProp(sel.id, "align", align)}
                                className={`flex-1 text-center py-1.5 border rounded-lg capitalize ${
                                  sel.properties.align === align ? "bg-indigo-600 border-indigo-600 text-white" : "border-[#221740] text-gray-400"
                                }`}
                              >
                                {align}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {sel.type === "quiz" && (
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Add quiz options</span>
                          <button
                            onClick={() => {
                              const opts = [...(sel.properties.options || []), `Option ${(sel.properties.options || []).length + 1}`];
                              handleUpdateBlockProp(sel.id, "options", opts);
                            }}
                            className="w-full mt-2 rounded-xl bg-indigo-600/30 border border-indigo-500/20 py-2 text-[10px] font-bold text-white hover:bg-indigo-600"
                          >
                            + Add Option
                          </button>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Layout ID</span>
                        <p className="mt-1 font-mono text-[10px] text-gray-500 bg-[#06040f] p-1.5 rounded border border-[#221740] truncate select-all">
                          {sel.id}
                        </p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-xs text-gray-400 italic">Select any block on the canvas to configure properties.</p>
              )}
            </section>
          )}
        </main>
      )}

      {/* Double Confirm Modal */}
      <DoubleConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setConfirmModalOpen(false);
        }}
        title={confirmModalTitle}
        description={confirmModalDesc}
        confirmWord={confirmWord}
        danger={true}
      />
    </div>
  );
}
