import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Compass,
  Zap,
  CheckCircle2,
  Lock,
  Unlock,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export type SkillStatus = 'mastered' | 'in_progress' | 'unlocked' | 'locked';

export interface SkillNodeData {
  id: string;
  name: string;
  category: 'Core Architecture' | 'Acceleration & Kernel' | 'Distributed Protocols' | 'Production & SRE' | 'Capstone';
  tier: number; // 0: Root role, 1: Category Pillar, 2: Core Competency, 3: Advanced Mastery
  status: SkillStatus;
  progressPercent: number; // 0 - 100
  marketValueDelta: string;
  hoursToMaster: number;
  description: string;
  challenge: string;
  prerequisites: string[];
  resources: string[];
  children?: SkillNodeData[];
}

interface InteractiveSkillTreeProps {
  targetRole: string;
  targetSalary: number;
  currentRole: string;
  onSkillMasteryChange?: (skillId: string, newStatus: SkillStatus, newProgress: number) => void;
}

// Generate role-specific skill tree hierarchy
function getSkillTreeDataForRole(targetRole: string, targetSalary: number): SkillNodeData {
  const isQuant = targetRole.toLowerCase().includes('quant') || targetRole.toLowerCase().includes('trading');
  const isRobotics = targetRole.toLowerCase().includes('robot') || targetRole.toLowerCase().includes('autonom');
  
  if (isQuant) {
    return {
      id: 'root',
      name: targetRole,
      category: 'Capstone',
      tier: 0,
      status: 'in_progress',
      progressPercent: 78,
      marketValueDelta: `+$${Math.round(targetSalary * 0.35).toLocaleString()} Base`,
      hoursToMaster: 0,
      description: 'Apex quantitative systems engineering and microstructure optimization competency.',
      challenge: 'Deterministic tick-to-trade order book gateway with zero packet drop.',
      prerequisites: [],
      resources: ['Market Microstructure in Practice', 'C++ Low Latency Handbook'],
      children: [
        {
          id: 'pillar-kernel',
          name: 'Kernel Bypass & Hardware Acceleration',
          category: 'Acceleration & Kernel',
          tier: 1,
          status: 'mastered',
          progressPercent: 100,
          marketValueDelta: '+$45,000',
          hoursToMaster: 80,
          description: 'Sub-microsecond networking bypassing the Linux TCP stack.',
          challenge: 'Write a Solarflare Onload/DPDK packet capture driver.',
          prerequisites: ['root'],
          resources: ['DPDK Architecture Guide', 'Solarflare OpenOnload Manual'],
          children: [
            {
              id: 'dpdk',
              name: 'Solarflare DPDK & Ef_vi',
              category: 'Acceleration & Kernel',
              tier: 2,
              status: 'mastered',
              progressPercent: 100,
              marketValueDelta: '+$28,000',
              hoursToMaster: 45,
              description: 'Zero-copy direct network adapter frame access.',
              challenge: 'Build direct memory mapped ring buffer consumer.',
              prerequisites: ['pillar-kernel'],
              resources: ['Intel DPDK Programmer Guide'],
            },
            {
              id: 'fpga-hdl',
              name: 'FPGA Co-Processing (SystemVerilog)',
              category: 'Acceleration & Kernel',
              tier: 2,
              status: 'in_progress',
              progressPercent: 65,
              marketValueDelta: '+$35,000',
              hoursToMaster: 90,
              description: 'Hardware pipeline synthesis for sub-100ns trade filtering.',
              challenge: 'Synthesize fixed-point tick parser on Xilinx UltraScale+.',
              prerequisites: ['pillar-kernel'],
              resources: ['High-Level Synthesis for Quant Trading'],
              children: [
                {
                  id: 'pcie-dma',
                  name: 'PCIe Gen5 DMA Engines',
                  category: 'Acceleration & Kernel',
                  tier: 3,
                  status: 'unlocked',
                  progressPercent: 30,
                  marketValueDelta: '+$22,000',
                  hoursToMaster: 50,
                  description: 'Host-to-card scatter-gather memory streaming.',
                  challenge: 'Write a custom Linux kernel character driver with MSI-X interrupts.',
                  prerequisites: ['fpga-hdl'],
                  resources: ['Linux Device Drivers, 4th Edition'],
                },
              ],
            },
          ],
        },
        {
          id: 'pillar-microstructure',
          name: 'Market Microstructure & Order Books',
          category: 'Core Architecture',
          tier: 1,
          status: 'mastered',
          progressPercent: 92,
          marketValueDelta: '+$50,000',
          hoursToMaster: 70,
          description: 'L3 market data feed arbitrage, matching engines, and latency queues.',
          challenge: 'Construct lock-free L3 limit order book with cache-friendly contiguous arrays.',
          prerequisites: ['root'],
          resources: ['Trading and Exchanges by Larry Harris'],
          children: [
            {
              id: 'itch-ouch',
              name: 'NASDAQ ITCH 5.0 & OUCH Protocols',
              category: 'Core Architecture',
              tier: 2,
              status: 'mastered',
              progressPercent: 100,
              marketValueDelta: '+$25,000',
              hoursToMaster: 35,
              description: 'Binary wire encoding, MoldUDP64 multicast recovery.',
              challenge: 'Parse 10M ITCH messages/sec with zero allocations.',
              prerequisites: ['pillar-microstructure'],
              resources: ['NASDAQ TotalView-ITCH Specification'],
            },
            {
              id: 'lockfree-ring',
              name: 'Single-Producer Lock-Free Queues',
              category: 'Core Architecture',
              tier: 2,
              status: 'in_progress',
              progressPercent: 85,
              marketValueDelta: '+$30,000',
              hoursToMaster: 40,
              description: 'Disruptor ring buffers, cache line padding, memory fences.',
              challenge: 'Demonstrate zero false-sharing under contention.',
              prerequisites: ['pillar-microstructure'],
              resources: ['LMAX Disruptor Technical Paper'],
              children: [
                {
                  id: 'simd-parsing',
                  name: 'AVX-512 SIMD Parallel Filtering',
                  category: 'Core Architecture',
                  tier: 3,
                  status: 'unlocked',
                  progressPercent: 20,
                  marketValueDelta: '+$26,000',
                  hoursToMaster: 60,
                  description: 'Vectorized SIMD instruction sets for algorithmic tick filtering.',
                  challenge: 'Vectorize 8 parallel quotes per CPU cycle.',
                  prerequisites: ['lockfree-ring'],
                  resources: ['Intel Intrinsics Guide for AVX-512'],
                },
              ],
            },
          ],
        },
        {
          id: 'pillar-cpp',
          name: 'Modern C++23 Low-Latency Metaprogramming',
          category: 'Distributed Protocols',
          tier: 1,
          status: 'in_progress',
          progressPercent: 80,
          marketValueDelta: '+$40,000',
          hoursToMaster: 75,
          description: 'Compile-time type introspection, concepts, constexpr evaluation.',
          challenge: 'Generate serialization dispatch tables at compile-time.',
          prerequisites: ['root'],
          resources: ['Effective Modern C++ by Scott Meyers'],
          children: [
            {
              id: 'zero-copy-alloc',
              name: 'Custom Arena & Pool Allocators',
              category: 'Distributed Protocols',
              tier: 2,
              status: 'in_progress',
              progressPercent: 70,
              marketValueDelta: '+$22,000',
              hoursToMaster: 30,
              description: 'Pre-allocated hugepage memory regions avoiding glibc malloc locks.',
              challenge: 'Design arena allocator with O(1) allocation and bulk deallocation.',
              prerequisites: ['pillar-cpp'],
              resources: ['Memory Management Algorithms'],
            },
            {
              id: 'branch-prediction',
              name: 'Deterministic Branchless Execution',
              category: 'Distributed Protocols',
              tier: 2,
              status: 'locked',
              progressPercent: 0,
              marketValueDelta: '+$25,000',
              hoursToMaster: 55,
              description: 'Eliminate branch predictor pipeline flushes in execution hot paths.',
              challenge: 'Convert nested conditional trade router into branchless bitwise logic.',
              prerequisites: ['pillar-cpp'],
              resources: ['Computer Systems: A Programmer’s Perspective'],
            },
          ],
        },
      ],
    };
  }

  if (isRobotics) {
    return {
      id: 'root',
      name: targetRole,
      category: 'Capstone',
      tier: 0,
      status: 'in_progress',
      progressPercent: 72,
      marketValueDelta: `+$${Math.round(targetSalary * 0.32).toLocaleString()} Base`,
      hoursToMaster: 0,
      description: 'Tactical autonomous vehicle perception, sensor fusion, and real-time control stacks.',
      challenge: 'End-to-end fail-safe autonomy architecture under GPS-denied environments.',
      prerequisites: [],
      resources: ['Probabilistic Robotics', 'Autonomous Systems Handbook'],
      children: [
        {
          id: 'pillar-slam',
          name: 'LiDAR SLAM & Spatial Mapping',
          category: 'Core Architecture',
          tier: 1,
          status: 'mastered',
          progressPercent: 95,
          marketValueDelta: '+$42,000',
          hoursToMaster: 75,
          description: 'Point cloud registration, loop closure, and factor graph optimization.',
          challenge: 'Implement LOAM (LiDAR Odometry and Mapping) running at 30Hz.',
          prerequisites: ['root'],
          resources: ['GTSAM Optimization Library Guide'],
          children: [
            {
              id: 'point-cloud',
              name: 'CUDA Point Cloud Segmentation',
              category: 'Core Architecture',
              tier: 2,
              status: 'mastered',
              progressPercent: 100,
              marketValueDelta: '+$25,000',
              hoursToMaster: 40,
              description: 'Real-time voxel grid downsampling and Euclidean cluster extraction.',
              challenge: 'Process 1M points/sec on embedded Jetson AGX Orin.',
              prerequisites: ['pillar-slam'],
              resources: ['PCL Point Cloud Library Docs'],
            },
            {
              id: 'factor-graphs',
              name: 'Nonlinear Factor Graph Optimization',
              category: 'Core Architecture',
              tier: 2,
              status: 'in_progress',
              progressPercent: 60,
              marketValueDelta: '+$30,000',
              hoursToMaster: 50,
              description: 'GTSAM IMU pre-integration and kinematic state estimation.',
              challenge: 'Fuse RTK GPS, LiDAR, and wheel odometry with outlier rejection.',
              prerequisites: ['pillar-slam'],
              resources: ['Factor Graphs for Robot Perception'],
            },
          ],
        },
        {
          id: 'pillar-control',
          name: 'Real-Time Edge Autonomy & ROS 2',
          category: 'Production & SRE',
          tier: 1,
          status: 'in_progress',
          progressPercent: 82,
          marketValueDelta: '+$38,000',
          hoursToMaster: 65,
          description: 'Deterministic micro-ROS pipelines with PREEMPT_RT Linux kernel.',
          challenge: 'Guarantee zero latency spikes on safety-critical steering bus.',
          prerequisites: ['root'],
          resources: ['ROS 2 Real-Time Design RFCs'],
          children: [
            {
              id: 'preempt-rt',
              name: 'PREEMPT_RT Real-Time Linux Kernel',
              category: 'Production & SRE',
              tier: 2,
              status: 'mastered',
              progressPercent: 90,
              marketValueDelta: '+$24,000',
              hoursToMaster: 35,
              description: 'Deterministic interrupt handling and thread priority inheritance.',
              challenge: 'Configure 1000Hz cyclic task with sub-15us maximum jitter.',
              prerequisites: ['pillar-control'],
              resources: ['OSADL Real-Time Linux Wiki'],
            },
            {
              id: 'model-predictive',
              name: 'Nonlinear MPC Trajectory Control',
              category: 'Production & SRE',
              tier: 2,
              status: 'unlocked',
              progressPercent: 40,
              marketValueDelta: '+$32,000',
              hoursToMaster: 60,
              description: 'Dynamic obstacle evasion and vehicle slip dynamics.',
              challenge: 'Formulate ACADO / OSQP quadratic program solver for high-speed turns.',
              prerequisites: ['pillar-control'],
              resources: ['Predictive Control for Autonomous Vehicles'],
              children: [
                {
                  id: 'fail-safe-watchdog',
                  name: 'Hardware E-Stop & Watchdog Architecture',
                  category: 'Production & SRE',
                  tier: 3,
                  status: 'locked',
                  progressPercent: 0,
                  marketValueDelta: '+$20,000',
                  hoursToMaster: 30,
                  description: 'Triple-modular redundant fail-operational hardware supervisor.',
                  challenge: 'Design dual micro-controller heartbeats with automatic brake lock.',
                  prerequisites: ['model-predictive'],
                  resources: ['ISO 26262 Automotive Functional Safety'],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  // Default: AI Infrastructure & Distributed Systems
  return {
    id: 'root',
    name: targetRole,
    category: 'Capstone',
    tier: 0,
    status: 'in_progress',
    progressPercent: 85,
    marketValueDelta: `+$${Math.round(targetSalary * 0.38).toLocaleString()} Base`,
    hoursToMaster: 0,
    description: 'Foundational leadership across multi-datacenter GPU clusters, distributed training pipelines, and custom acceleration kernels.',
    challenge: 'Architect zero-loss multi-thousand GPU cluster with automated network fault recovery.',
    prerequisites: [],
    resources: ['Distributed Systems: Principles and Paradigms', 'NVIDIA Hopper & Blackwell Whitepapers'],
    children: [
      {
        id: 'pillar-distributed',
        name: 'Distributed Compute & Cluster Fabrics',
        category: 'Core Architecture',
        tier: 1,
        status: 'mastered',
        progressPercent: 96,
        marketValueDelta: '+$55,000',
        hoursToMaster: 85,
        description: 'RoCE v2, InfiniBand HDR/NDR rail-optimized topologies, and NCCL collective algorithms.',
        challenge: 'Debug cross-node InfiniBand packet drops during 4,096-GPU all-reduce.',
        prerequisites: ['root'],
        resources: ['NCCL Architecture Guide', 'RDMA Aware Networks and RoCE v2'],
        children: [
          {
            id: 'infiniband-roce',
            name: 'InfiniBand & RoCE v2 Rail Topology',
            category: 'Core Architecture',
            tier: 2,
            status: 'mastered',
            progressPercent: 100,
            marketValueDelta: '+$32,000',
            hoursToMaster: 50,
            description: 'Non-blocking fat-tree Clos fabric with adaptive routing.',
            challenge: 'Configure PFC (Priority Flow Control) and ECN to avoid RDMA buffer bloat.',
            prerequisites: ['pillar-distributed'],
            resources: ['Mellanox / NVIDIA InfiniBand Network Engineering'],
          },
          {
            id: 'nccl-collectives',
            name: 'NCCL Ring All-Reduce & Tree Tuning',
            category: 'Core Architecture',
            tier: 2,
            status: 'mastered',
            progressPercent: 92,
            marketValueDelta: '+$30,000',
            hoursToMaster: 45,
            description: 'Optimizing inter-GPU bandwidth across NVLink and PCIe switches.',
            challenge: 'Tune NCCL_ALGO and NCCL_BUFFSIZE for 20% faster gradient sync.',
            prerequisites: ['pillar-distributed'],
            resources: ['NVIDIA Collective Communication Library (NCCL) Internals'],
            children: [
              {
                id: 'megatron-parallel',
                name: '3D Parallelism (TP, PP, ZeRO-3)',
                category: 'Core Architecture',
                tier: 3,
                status: 'in_progress',
                progressPercent: 75,
                marketValueDelta: '+$38,000',
                hoursToMaster: 65,
                description: 'Megatron-LM tensor and pipeline sharding with DeepSpeed ZeRO-3.',
                challenge: 'Shard 405B foundation model across 512 H100 GPUs with activation checkpointing.',
                prerequisites: ['nccl-collectives'],
                resources: ['Megatron-LM: Training Multi-Billion Parameter Language Models'],
              },
            ],
          },
        ],
      },
      {
        id: 'pillar-kernel',
        name: 'GPU Acceleration & Kernel Engineering',
        category: 'Acceleration & Kernel',
        tier: 1,
        status: 'in_progress',
        progressPercent: 78,
        marketValueDelta: '+$48,000',
        hoursToMaster: 90,
        description: 'Writing high-throughput CUDA kernels, Triton compiler optimization, and FlashAttention.',
        challenge: 'Implement custom MoE (Mixture of Experts) router kernel in Triton.',
        prerequisites: ['root'],
        resources: ['CUDA Programming Guide', 'OpenAI Triton Compiler Documentation'],
        children: [
          {
            id: 'triton-kernels',
            name: 'OpenAI Triton Compiler',
            category: 'Acceleration & Kernel',
            tier: 2,
            status: 'in_progress',
            progressPercent: 82,
            marketValueDelta: '+$28,000',
            hoursToMaster: 40,
            description: 'Block-level parallelism, shared memory tiling, and warp scheduling.',
            challenge: 'Write fused layer-norm + GeLU kernel outperforming PyTorch native by 2.4x.',
            prerequisites: ['pillar-kernel'],
            resources: ['Triton: An Intermediate Language and Compiler for Tiled Neural Networks'],
          },
          {
            id: 'flash-attention',
            name: 'FlashAttention-3 & FP8 GEMMs',
            category: 'Acceleration & Kernel',
            tier: 2,
            status: 'unlocked',
            progressPercent: 45,
            marketValueDelta: '+$35,000',
            hoursToMaster: 55,
            description: 'IO-aware exact attention algorithm with asynchronous memory copies (TMA).',
            challenge: 'Implement hardware-accelerated warp-specialized matrix multiply on Hopper.',
            prerequisites: ['pillar-kernel'],
            resources: ['FlashAttention-3: Fast and Memory-Efficient Exact Attention with Asynchrony'],
            children: [
              {
                id: 'cuda-graphs',
                name: 'CUDA Graphs & Kernel Fusion',
                category: 'Acceleration & Kernel',
                tier: 3,
                status: 'unlocked',
                progressPercent: 30,
                marketValueDelta: '+$24,000',
                hoursToMaster: 35,
                description: 'Eliminate host CPU launch overhead during continuous token generation.',
                challenge: 'Capture dynamic LLM inference decoding loop into a persistent CUDA Graph.',
                prerequisites: ['flash-attention'],
                resources: ['NVIDIA CUDA Graph Execution Engine Manual'],
              },
            ],
          },
        ],
      },
      {
        id: 'pillar-production',
        name: 'LLM Serving & Inference Engines',
        category: 'Production & SRE',
        tier: 1,
        status: 'mastered',
        progressPercent: 90,
        marketValueDelta: '+$42,000',
        hoursToMaster: 60,
        description: 'Continuous batching, PagedAttention, vLLM, TensorRT-LLM, and speculative decoding.',
        challenge: 'Achieve 3,200 tokens/sec sustained throughput on dual 8xH100 nodes.',
        prerequisites: ['root'],
        resources: ['vLLM: Efficient Memory Management for Large Language Models with PagedAttention'],
        children: [
          {
            id: 'vllm-engine',
            name: 'vLLM PagedAttention Architecture',
            category: 'Production & SRE',
            tier: 2,
            status: 'mastered',
            progressPercent: 95,
            marketValueDelta: '+$26,000',
            hoursToMaster: 35,
            description: 'Non-contiguous KV-cache memory allocation avoiding internal fragmentation.',
            challenge: 'Deploy multi-LoRA dynamic adapter swapping under heavy traffic.',
            prerequisites: ['pillar-production'],
            resources: ['vLLM GitHub Architecture Docs'],
          },
          {
            id: 'speculative-decoding',
            name: 'Speculative Decoding & Medusa Heads',
            category: 'Production & SRE',
            tier: 2,
            status: 'unlocked',
            progressPercent: 50,
            marketValueDelta: '+$29,000',
            hoursToMaster: 45,
            description: 'Draft model verification and multi-head parallel acceptance verification.',
            challenge: 'Integrate 3-token draft tree verification achieving 2.1x wall-clock speedup.',
            prerequisites: ['pillar-production'],
            resources: ['Fast Inference from Transformers via Speculative Decoding'],
            children: [
              {
                id: 'slurm-orchestration',
                name: 'Slurm Multi-Node Fault Recovery',
                category: 'Production & SRE',
                tier: 3,
                status: 'locked',
                progressPercent: 0,
                marketValueDelta: '+$22,000',
                hoursToMaster: 40,
                description: 'Automated health checks, node eviction, and uncorrupted checkpoint restarts.',
                challenge: 'Write PyTorch Elastic / Slurm hook to resume 70B training within 90 seconds of node failure.',
                prerequisites: ['speculative-decoding'],
                resources: ['Slurm Workload Manager Architecture'],
              },
            ],
          },
        ],
      },
    ],
  };
}

export default function InteractiveSkillTree({
  targetRole,
  targetSalary,
  currentRole,
  onSkillMasteryChange,
}: InteractiveSkillTreeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoomBehaviorRef = useRef<any>(null);

  // Tree data state
  const [treeData, setTreeData] = useState<SkillNodeData>(() =>
    getSkillTreeDataForRole(targetRole, targetSalary)
  );

  // Selected skill node for detailed telemetry inspect
  const [selectedSkill, setSelectedSkill] = useState<SkillNodeData | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | SkillStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Re-generate tree when target role changes
  useEffect(() => {
    const updated = getSkillTreeDataForRole(targetRole, targetSalary);
    setTreeData(updated);
    setSelectedSkill(updated);
  }, [targetRole, targetSalary]);

  // Flattened skills for statistics & search
  const allNodesList = useMemo(() => {
    const list: SkillNodeData[] = [];
    function traverse(node: SkillNodeData) {
      list.push(node);
      if (node.children) {
        node.children.forEach(traverse);
      }
    }
    traverse(treeData);
    return list;
  }, [treeData]);

  const stats = useMemo(() => {
    const mastered = allNodesList.filter((n) => n.status === 'mastered').length;
    const inProgress = allNodesList.filter((n) => n.status === 'in_progress').length;
    const unlocked = allNodesList.filter((n) => n.status === 'unlocked').length;
    const locked = allNodesList.filter((n) => n.status === 'locked').length;
    const totalHours = allNodesList.reduce((acc, n) => acc + (n.status !== 'mastered' ? n.hoursToMaster : 0), 0);
    const overallProgress = Math.round(
      allNodesList.reduce((acc, n) => acc + n.progressPercent, 0) / (allNodesList.length || 1)
    );
    return { mastered, inProgress, unlocked, locked, totalHours, overallProgress, total: allNodesList.length };
  }, [allNodesList]);

  // Toggle or Update Skill Status
  const handleUpdateStatus = (skillId: string, newStatus: SkillStatus, newProgress: number) => {
    function updateRecursive(node: SkillNodeData): SkillNodeData {
      if (node.id === skillId) {
        return {
          ...node,
          status: newStatus,
          progressPercent: newProgress,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateRecursive),
        };
      }
      return node;
    }

    const updated = updateRecursive(treeData);
    setTreeData(updated);

    // Update selected skill if matching
    if (selectedSkill?.id === skillId) {
      setSelectedSkill((prev) => (prev ? { ...prev, status: newStatus, progressPercent: newProgress } : null));
    }

    if (onSkillMasteryChange) {
      onSkillMasteryChange(skillId, newStatus, newProgress);
    }
  };

  // Zoom Controls
  const handleZoom = (scaleFactor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomBehaviorRef.current.scaleBy, scaleFactor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(80, 240).scale(0.85));
  };

  // Render D3 Interactive Visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = 560;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Definitions (Gradients, Dropshadows, Glows)
    const defs = svg.append('defs');

    // Glow filter for mastered nodes
    const glowFilter = defs.append('filter').attr('id', 'emerald-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Link Gradients
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'skill-link-gradient')
      .attr('gradientUnits', 'userSpaceOnUse');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#22d3a5').attr('stop-opacity', 0.8);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#38bdf8').attr('stop-opacity', 0.5);

    // Root Group for Zoom/Pan
    const g = svg.append('g').attr('class', 'tree-viewport');

    // Zoom setup
    const zoom = d3
      .zoom()
      .scaleExtent([0.4, 2.5])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Initial transform
    svg.call(zoom.transform, d3.zoomIdentity.translate(60, height / 2 - 40).scale(0.85));

    // Construct D3 Hierarchy
    const root = d3.hierarchy(treeData);

    // D3 Tree layout (horizontal orientation: dx is vertical separation, dy is horizontal separation)
    const nodeWidth = 230;
    const nodeHeight = 85;
    const treeLayout = d3.tree().nodeSize([nodeHeight + 35, nodeWidth + 90]);

    treeLayout(root);

    // Filter matching helper
    const isMatching = (d: any) => {
      const statusMatch = statusFilter === 'all' || d.data.status === statusFilter;
      const searchMatch = !searchQuery || d.data.name.toLowerCase().includes(searchQuery.toLowerCase());
      return statusMatch && searchMatch;
    };

    // Draw Links (Curved cubic bezier links)
    const linkGenerator = d3
      .linkHorizontal()
      .x((d: any) => d.y)
      .y((d: any) => d.x);

    g.selectAll('.skill-link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'skill-link')
      .attr('d', linkGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        if (d.target.data.status === 'mastered') return '#22d3a5';
        if (d.target.data.status === 'in_progress') return '#38bdf8';
        if (d.target.data.status === 'unlocked') return '#fbbf24';
        return '#1e2b36';
      })
      .attr('stroke-width', (d: any) => (d.target.data.status === 'mastered' ? 2.5 : 1.5))
      .attr('stroke-dasharray', (d: any) => (d.target.data.status === 'locked' ? '4,4' : 'none'))
      .attr('opacity', (d: any) => (d.target.data.status === 'locked' ? 0.35 : 0.85))
      .transition()
      .duration(600);

    // Draw Nodes
    const nodes = g
      .selectAll('.skill-node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', (d: any) => `skill-node node-${d.data.id}`)
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer')
      .on('click', (event: any, d: any) => {
        setSelectedSkill(d.data);
      });

    // Node Container Box (Tactical Card)
    const cardWidth = 210;
    const cardHeight = 72;

    nodes
      .append('rect')
      .attr('x', -10)
      .attr('y', -cardHeight / 2)
      .attr('width', cardWidth)
      .attr('height', cardHeight)
      .attr('rx', 8)
      .attr('fill', (d: any) => {
        if (selectedSkill?.id === d.data.id) return '#162838';
        if (d.data.status === 'mastered') return '#0d1d1a';
        if (d.data.status === 'in_progress') return '#0d1a24';
        if (d.data.status === 'unlocked') return '#171911';
        return '#0a0f14';
      })
      .attr('stroke', (d: any) => {
        if (selectedSkill?.id === d.data.id) return '#38bdf8';
        if (d.data.status === 'mastered') return '#22d3a5';
        if (d.data.status === 'in_progress') return '#38bdf8';
        if (d.data.status === 'unlocked') return '#fbbf24';
        return '#1e2b36';
      })
      .attr('stroke-width', (d: any) => (selectedSkill?.id === d.data.id ? 2.5 : d.data.status === 'mastered' ? 2 : 1))
      .attr('filter', (d: any) => (d.data.status === 'mastered' ? 'url(#emerald-glow)' : 'none'))
      .attr('opacity', (d: any) => (isMatching(d) ? 1 : 0.25));

    // Status Indicator Dot or Ring
    nodes
      .append('circle')
      .attr('cx', 8)
      .attr('cy', -cardHeight / 2 + 16)
      .attr('r', 5)
      .attr('fill', (d: any) => {
        if (d.data.status === 'mastered') return '#22d3a5';
        if (d.data.status === 'in_progress') return '#38bdf8';
        if (d.data.status === 'unlocked') return '#fbbf24';
        return '#64748b';
      })
      .attr('opacity', (d: any) => (isMatching(d) ? 1 : 0.3));

    // Category Badge Text
    nodes
      .append('text')
      .attr('x', 20)
      .attr('y', -cardHeight / 2 + 19)
      .attr('fill', '#7a8b99')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .text((d: any) => d.data.category.toUpperCase().slice(0, 18))
      .attr('opacity', (d: any) => (isMatching(d) ? 1 : 0.25));

    // Market Value Badge (Right side of header)
    nodes
      .append('text')
      .attr('x', cardWidth - 18)
      .attr('y', -cardHeight / 2 + 19)
      .attr('text-anchor', 'end')
      .attr('fill', (d: any) => (d.data.status === 'mastered' ? '#22d3a5' : '#fbbf24'))
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d: any) => d.data.marketValueDelta)
      .attr('opacity', (d: any) => (isMatching(d) ? 1 : 0.25));

    // Node Title (Truncated if needed)
    nodes
      .append('text')
      .attr('x', 8)
      .attr('y', -cardHeight / 2 + 38)
      .attr('fill', (d: any) => {
        if (d.data.status === 'locked') return '#64748b';
        return '#f1f5f9';
      })
      .attr('font-size', (d: any) => (d.data.tier === 0 ? '12px' : '11px'))
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d: any) => (d.data.name.length > 24 ? d.data.name.slice(0, 23) + '…' : d.data.name))
      .attr('opacity', (d: any) => (isMatching(d) ? 1 : 0.25));

    // Progress Bar Background
    nodes
      .append('rect')
      .attr('x', 8)
      .attr('y', -cardHeight / 2 + 48)
      .attr('width', cardWidth - 36)
      .attr('height', 4)
      .attr('rx', 2)
      .attr('fill', '#0a0f14')
      .attr('stroke', '#1e2b36')
      .attr('stroke-width', 0.5);

    // Progress Bar Fill
    nodes
      .append('rect')
      .attr('x', 8)
      .attr('y', -cardHeight / 2 + 48)
      .attr('width', (d: any) => ((cardWidth - 36) * d.data.progressPercent) / 100)
      .attr('height', 4)
      .attr('rx', 2)
      .attr('fill', (d: any) => {
        if (d.data.status === 'mastered') return '#22d3a5';
        if (d.data.status === 'in_progress') return '#38bdf8';
        if (d.data.status === 'unlocked') return '#fbbf24';
        return '#334155';
      });

    // Progress Percentage Label
    nodes
      .append('text')
      .attr('x', cardWidth - 22)
      .attr('y', -cardHeight / 2 + 52)
      .attr('text-anchor', 'end')
      .attr('fill', '#7a8b99')
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .text((d: any) => `${d.data.progressPercent}%`);

    // Status Label Tag at bottom
    nodes
      .append('text')
      .attr('x', 8)
      .attr('y', -cardHeight / 2 + 63)
      .attr('fill', (d: any) => {
        if (d.data.status === 'mastered') return '#22d3a5';
        if (d.data.status === 'in_progress') return '#38bdf8';
        if (d.data.status === 'unlocked') return '#fbbf24';
        return '#64748b';
      })
      .attr('font-size', '8px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d: any) => `● ${d.data.status.replace('_', ' ').toUpperCase()}`);

  }, [treeData, selectedSkill, statusFilter, searchQuery]);

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Skill Tree Header & Telemetry Strip */}
      <div className="bg-[#111a22] border border-[#22d3a5]/40 rounded-xl p-4 shadow-[0_0_20px_rgba(34,211,165,0.1)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] text-[10px] font-bold border border-[#22d3a5]/40 flex items-center gap-1.5 animate-pulse">
              <Compass className="w-3.5 h-3.5" />
              D3 NODE-BASED SKILL TREE &amp; PROGRESSION GRAPH
            </span>
            <span className="text-xs text-[#7a8b99]">ROLE: {targetRole.toUpperCase()}</span>
          </div>
          <h3 className="text-base font-bold text-[#dce7f0] mt-1 flex items-center gap-2">
            Interactive Competency Graph &amp; Prerequisites Engine
          </h3>
          <p className="text-xs text-[#94a3b8] font-sans mt-0.5 max-w-2xl">
            Explore hierarchical competency branches, track real-time mastery progress, inspect prerequisite chains, and unlock estimated salary progression deltas.
          </p>
        </div>

        {/* Global Competency Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] shrink-0">
          <div className="p-2 bg-[#0a0f14] rounded-lg border border-[#1e2b36]">
            <span className="text-[#7a8b99] block text-[10px]">TOTAL NODES</span>
            <span className="font-bold text-[#dce7f0]">{stats.total} Competencies</span>
          </div>

          <div className="p-2 bg-[#0a0f14] rounded-lg border border-[#1e2b36]">
            <span className="text-[#22d3a5] block text-[10px]">MASTERED</span>
            <span className="font-bold text-[#22d3a5]">{stats.mastered} Nodes (100%)</span>
          </div>

          <div className="p-2 bg-[#0a0f14] rounded-lg border border-[#1e2b36]">
            <span className="text-[#38bdf8] block text-[10px]">IN PROGRESS</span>
            <span className="font-bold text-[#38bdf8]">{stats.inProgress} Nodes</span>
          </div>

          <div className="p-2 bg-[#0a0f14] rounded-lg border border-[#1e2b36]">
            <span className="text-[#fbbf24] block text-[10px]">REMAINING RUNWAY</span>
            <span className="font-bold text-[#fbbf24]">~{stats.totalHours} Study Hrs</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area (Tree on Left, Telemetry Inspector on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* D3 Graph Canvas Viewport (8 Cols on LG) */}
        <div
          ref={containerRef}
          className="lg:col-span-8 bg-[#0a0f14] border border-[#1e2b36] rounded-xl p-3 relative flex flex-col justify-between overflow-hidden shadow-2xl min-h-[560px]"
        >
          {/* Top Interactive Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 z-10 bg-[#111a22]/90 backdrop-blur-md p-2 rounded-lg border border-[#1e2b36]">
            {/* Search Input */}
            <div className="flex items-center gap-1.5 bg-[#0a0f14] border border-[#1e2b36] rounded px-2.5 py-1 text-xs text-[#dce7f0]">
              <Search className="w-3.5 h-3.5 text-[#7a8b99]" />
              <input
                type="text"
                placeholder="Search skill nodes (e.g. CUDA, DPDK)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-[#dce7f0] placeholder-[#64748b] w-36 sm:w-48"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#7a8b99] hover:text-[#dce7f0]">
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 text-[10px]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded transition ${
                  statusFilter === 'all' ? 'bg-[#22d3a5] text-black font-bold' : 'text-[#7a8b99] hover:text-[#dce7f0]'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter('mastered')}
                className={`px-2 py-0.5 rounded transition ${
                  statusFilter === 'mastered' ? 'bg-[#22d3a5] text-black font-bold' : 'text-[#7a8b99] hover:text-[#22d3a5]'
                }`}
              >
                Mastered ({stats.mastered})
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-2 py-0.5 rounded transition ${
                  statusFilter === 'in_progress' ? 'bg-[#38bdf8] text-black font-bold' : 'text-[#7a8b99] hover:text-[#38bdf8]'
                }`}
              >
                Active ({stats.inProgress})
              </button>
              <button
                onClick={() => setStatusFilter('unlocked')}
                className={`px-2 py-0.5 rounded transition ${
                  statusFilter === 'unlocked' ? 'bg-[#fbbf24] text-black font-bold' : 'text-[#7a8b99] hover:text-[#fbbf24]'
                }`}
              >
                Ready ({stats.unlocked})
              </button>
            </div>

            {/* D3 Zoom Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleZoom(1.25)}
                className="w-7 h-7 rounded bg-[#0a0f14] hover:bg-[#1e2b36] border border-[#1e2b36] flex items-center justify-center text-[#dce7f0] transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleZoom(0.8)}
                className="w-7 h-7 rounded bg-[#0a0f14] hover:bg-[#1e2b36] border border-[#1e2b36] flex items-center justify-center text-[#dce7f0] transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 h-7 rounded bg-[#0a0f14] hover:bg-[#1e2b36] border border-[#1e2b36] flex items-center gap-1 text-[#22d3a5] text-[10px] font-bold transition cursor-pointer"
                title="Center & Reset View"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* SVG Canvas Container */}
          <div className="flex-1 w-full h-[470px] relative overflow-hidden">
            <svg ref={svgRef} className="w-full h-full select-none" />

            {/* Floating Quick Hint */}
            <div className="absolute bottom-2 left-2 bg-[#0a0f14]/80 backdrop-blur border border-[#1e2b36] px-2.5 py-1 rounded text-[10px] text-[#7a8b99] flex items-center gap-2 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-[#22d3a5] animate-ping" />
              <span>Drag to Pan • Scroll to Zoom • Click any node to inspect telemetry</span>
            </div>
          </div>
        </div>

        {/* Selected Skill Telemetry & Upgrade Inspector (4 Cols on LG) */}
        <div className="lg:col-span-4 bg-[#111a22] border border-[#1e2b36] rounded-xl p-4 shadow-xl flex flex-col justify-between space-y-4 min-h-[560px]">
          {selectedSkill ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-[#1e2b36] pb-3">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="px-2 py-0.5 rounded bg-[#1e2b36] text-[#38bdf8] font-bold">
                    {selectedSkill.category.toUpperCase()}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      selectedSkill.status === 'mastered'
                        ? 'bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/50'
                        : selectedSkill.status === 'in_progress'
                        ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50'
                        : selectedSkill.status === 'unlocked'
                        ? 'bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {selectedSkill.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#dce7f0]">{selectedSkill.name}</h4>
                <div className="text-[11px] text-[#22d3a5] font-bold mt-0.5">
                  Compensation Impact: {selectedSkill.marketValueDelta}
                </div>
              </div>

              {/* Description */}
              <div className="p-3 bg-[#0a0f14] rounded-lg border border-[#1e2b36] text-[#94a3b8] text-xs font-sans leading-relaxed">
                {selectedSkill.description}
              </div>

              {/* Progress Slider & Status Toggle */}
              <div className="space-y-2 p-3 bg-[#0a0f14] rounded-lg border border-[#1e2b36]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7a8b99]">Proficiency Level:</span>
                  <span className="font-bold text-[#22d3a5]">{selectedSkill.progressPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={selectedSkill.progressPercent}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const newStatus: SkillStatus = val >= 95 ? 'mastered' : val > 0 ? 'in_progress' : 'unlocked';
                    handleUpdateStatus(selectedSkill.id, newStatus, val);
                  }}
                  className="w-full accent-[#22d3a5] cursor-pointer"
                />

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedSkill.id, 'mastered', 100)}
                    className="p-1.5 rounded bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 text-[#22d3a5] border border-[#22d3a5]/40 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Mark Mastered</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedSkill.id, 'in_progress', 60)}
                    className="p-1.5 rounded bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8] border border-[#38bdf8]/40 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span>Set Active (60%)</span>
                  </button>
                </div>
              </div>

              {/* Verification Challenge */}
              <div className="p-3 bg-[#0a0f14] rounded-lg border border-[#fbbf24]/30 space-y-1">
                <span className="text-[10px] text-[#fbbf24] font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  VERIFICATION PROJECT CHALLENGE:
                </span>
                <p className="text-xs text-[#dce7f0] font-sans leading-relaxed">
                  {selectedSkill.challenge}
                </p>
              </div>

              {/* Recommended Resources */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-[#7a8b99] block font-bold">
                  RECOMMENDED WHITE PAPERS &amp; RFCs:
                </span>
                {selectedSkill.resources.map((r, i) => (
                  <div key={i} className="p-2 rounded bg-[#0a0f14] border border-[#1e2b36] flex items-center gap-2 text-[#dce7f0]">
                    <BookOpen className="w-3 h-3 text-[#38bdf8] shrink-0" />
                    <span className="text-[11px] truncate font-sans">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#7a8b99] space-y-2">
              <Compass className="w-8 h-8 text-[#22d3a5] animate-spin" style={{ animationDuration: '20s' }} />
              <span className="font-bold text-[#dce7f0]">SELECT A NODE TO INSPECT</span>
              <p className="text-xs font-sans max-w-xs">
                Click any competency node on the D3 graph to view prerequisites, study challenges, and update proficiency.
              </p>
            </div>
          )}

          {/* Bottom Card Footer */}
          <div className="pt-3 border-t border-[#1e2b36] flex items-center justify-between text-[10px] text-[#7a8b99]">
            <span className="flex items-center gap-1 text-[#22d3a5]">
              <ShieldCheck className="w-3.5 h-3.5" /> Client-Verified
            </span>
            <span>Target Role: {targetRole.slice(0, 24)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
