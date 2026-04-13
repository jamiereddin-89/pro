/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Flex, 
  VStack, 
  HStack, 
  Text, 
  IconButton, 
  Button, 
  Textarea, 
  Tooltip, 
  Skeleton, 
  SkeletonText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  Progress,
  useToast,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  Switch,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge
} from '@chakra-ui/react';
import { 
  Sparkles, 
  Send, 
  Code, 
  Eye, 
  RotateCcw, 
  Copy, 
  Check, 
  Terminal, 
  Layout, 
  Zap,
  BrainCircuit,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Trash2,
  Settings,
  History,
  Box as BoxIcon,
  Globe,
  MoreVertical,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';
import { ModelType } from './lib/gemini';
import { useStore, Version } from './store/useStore';

export default function App() {
  const {
    html,
    userInput,
    isLoading,
    messages,
    model,
    isThinking,
    previewMode,
    activeTab,
    error,
    history: undoHistory,
    historyIndex,
    savedProjects,
    currentProjectId,
    generationMode,
    versions,
    settings,
    setUserInput,
    setModel,
    setIsThinking,
    setPreviewMode,
    setActiveTab,
    setError,
    clearChat,
    executeAiAction,
    retryLastAction,
    undo,
    redo,
    saveProject,
    loadProject,
    deleteProject,
    setGenerationMode,
    updateSettings,
    revertToVersion,
    setHtml
  } = useStore();

  const [copied, setCopied] = useState(false);
  const [projectName, setProjectName] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  
  const { isOpen: isSaveOpen, onOpen: onSaveOpen, onClose: onSaveClose } = useDisclosure();
  const { isOpen: isLoadOpen, onOpen: onLoadOpen, onClose: onLoadClose } = useDisclosure();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const { isOpen: isVersionsOpen, onOpen: onVersionsOpen, onClose: onVersionsClose } = useDisclosure();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;
    const prompt = userInput;
    setUserInput('');
    useStore.getState().addMessage({ role: 'user', content: prompt });
    await executeAiAction(prompt);
  };

  const handleRefactor = async () => {
    if (!html || isLoading) return;
    useStore.getState().addMessage({ role: 'user', content: "Refactor this code to follow modern best practices." });
    await executeAiAction("Refactor this code to follow modern best practices while preserving all functionality.");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(html);
    setCopied(true);
    toast({
      title: "Code copied.",
      status: "success",
      duration: 2000,
      isClosable: true,
      position: 'top'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!projectName.trim()) return;
    saveProject(projectName);
    onSaveClose();
    toast({
      title: "Project saved.",
      status: "success",
      duration: 2000,
      position: 'top'
    });
  };

  const getIframeWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  return (
    <Flex h="100vh" bg="#0a0a0c" color="slate.200" overflow="hidden">
      {/* Sidebar / Chat Panel */}
      <Box 
        w="400px" 
        display="flex" 
        flexDirection="column" 
        borderRight="1px solid" 
        borderColor="whiteAlpha.100" 
        bg="#0d0d11"
      >
        <Flex p={4} align="center" justify="space-between" borderBottom="1px solid" borderColor="whiteAlpha.100">
          <HStack spacing={3}>
            <Box 
              w={8} h={8} 
              borderRadius="lg" 
              bgGradient="linear(to-br, blue.500, purple.600)" 
              display="flex" 
              alignItems="center" 
              justifyContent="center" 
              boxShadow="0 0 15px rgba(66, 153, 225, 0.3)"
            >
              <Sparkles size={18} color="white" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="bold">Gemini Builder</Text>
              <Text fontSize="10px" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="widest">v2.5 Pro</Text>
            </VStack>
          </HStack>
          <HStack spacing={1}>
            <Tooltip label="Versions">
              <IconButton
                aria-label="Versions"
                icon={<History size={16} />}
                variant="ghost"
                size="sm"
                onClick={onVersionsOpen}
                color="whiteAlpha.600"
                _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
              />
            </Tooltip>
            <Tooltip label="Settings">
              <IconButton
                aria-label="Settings"
                icon={<Settings size={16} />}
                variant="ghost"
                size="sm"
                onClick={onSettingsOpen}
                color="whiteAlpha.600"
                _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
              />
            </Tooltip>
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Projects"
                icon={<FolderOpen size={16} />}
                variant="ghost"
                size="sm"
                color="whiteAlpha.600"
                _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
              />
              <Portal>
                <MenuList bg="#1a1a24" borderColor="whiteAlpha.200" zIndex={1000}>
                  <MenuItem icon={<Save size={14} />} onClick={onSaveOpen} bg="transparent" _hover={{ bg: 'whiteAlpha.100' }}>Save Current</MenuItem>
                  <MenuItem icon={<FolderOpen size={14} />} onClick={onLoadOpen} bg="transparent" _hover={{ bg: 'whiteAlpha.100' }}>Load Project</MenuItem>
                  <Divider my={2} borderColor="whiteAlpha.100" />
                  <MenuItem icon={<RotateCcw size={14} />} onClick={clearChat} color="red.400" bg="transparent" _hover={{ bg: 'whiteAlpha.100' }}>Clear All</MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </HStack>
        </Flex>

        {/* Mode & Model Selector */}
        <VStack spacing={0} borderBottom="1px solid" borderColor="whiteAlpha.100">
          <HStack w="full" px={4} py={2} spacing={2} overflowX="auto" className="no-scrollbar">
            <Button
              size="xs"
              borderRadius="full"
              leftIcon={<Globe size={12} />}
              variant={generationMode === 'website' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => setGenerationMode('website')}
              fontSize="10px"
            >
              Website
            </Button>
            <Button
              size="xs"
              borderRadius="full"
              leftIcon={<BoxIcon size={12} />}
              variant={generationMode === 'component' ? 'solid' : 'outline'}
              colorScheme="cyan"
              onClick={() => setGenerationMode('component')}
              fontSize="10px"
            >
              Component
            </Button>
          </HStack>
          
          {generationMode === 'component' && (
            <HStack w="full" px={4} py={2} spacing={2} overflowX="auto" className="no-scrollbar" bg="whiteAlpha.50">
              <Text fontSize="9px" fontWeight="bold" color="whiteAlpha.400" textTransform="uppercase">Quick:</Text>
              <Button size="xs" variant="ghost" fontSize="9px" onClick={() => executeAiAction("Generate a modern, responsive card component with an image, title, and description.")}>Card</Button>
              <Button size="xs" variant="ghost" fontSize="9px" onClick={() => executeAiAction("Generate a stylish contact form with validation.")}>Form</Button>
              <Button size="xs" variant="ghost" fontSize="9px" onClick={() => executeAiAction("Generate a set of modern, accessible buttons with different variants.")}>Buttons</Button>
              <Button size="xs" variant="ghost" fontSize="9px" onClick={() => executeAiAction("Generate a responsive navigation bar with a logo and links.")}>Navbar</Button>
            </HStack>
          )}

          <HStack w="full" px={4} py={2} spacing={2} overflowX="auto" className="no-scrollbar">
            <Button
              size="xs"
              borderRadius="full"
              leftIcon={<Zap size={12} />}
              variant={model === ModelType.FLASH && !isThinking ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => { setModel(ModelType.FLASH); setIsThinking(false); }}
              fontSize="10px"
            >
              Flash 2.0
            </Button>
            <Button
              size="xs"
              borderRadius="full"
              leftIcon={<BrainCircuit size={12} />}
              variant={isThinking ? 'solid' : 'outline'}
              colorScheme="purple"
              onClick={() => { setModel(ModelType.PRO); setIsThinking(true); }}
              fontSize="10px"
            >
              Thinking Mode
            </Button>
          </HStack>
        </VStack>

        {/* Chat History */}
        <Box flex={1} overflowY="auto" p={4} display="flex" flexDirection="column" gap={4}>
          {messages.length === 0 && !isLoading && (
            <VStack h="full" justify="center" opacity={0.4} spacing={4}>
              <Box p={4} borderRadius="full" bg="whiteAlpha.100">
                <Terminal size={32} />
              </Box>
              <VStack spacing={1}>
                <Text fontSize="sm" fontWeight="medium">Ready to build?</Text>
                <Text fontSize="xs" textAlign="center">
                  {generationMode === 'website' 
                    ? "Describe a website or landing page to get started." 
                    : "Describe a UI component (e.g., 'a modern login form') to generate it."}
                </Text>
              </VStack>
            </VStack>
          )}

          {messages.map((msg, i) => (
            <Flex key={i} justify={msg.role === 'user' ? 'flex-end' : 'flex-start'}>
              <Box 
                maxW="85%" 
                p={3} 
                borderRadius="2xl" 
                borderTopRightRadius={msg.role === 'user' ? 'none' : '2xl'}
                borderTopLeftRadius={msg.role === 'model' ? 'none' : '2xl'}
                bg={msg.role === 'user' ? 'blue.600' : 'whiteAlpha.100'}
                color={msg.role === 'user' ? 'white' : 'slate.200'}
                border={msg.role === 'model' ? '1px solid' : 'none'}
                borderColor="whiteAlpha.200"
                fontSize="xs"
                lineHeight="relaxed"
              >
                {msg.content}
              </Box>
            </Flex>
          ))}

          {isLoading && (
            <VStack align="start" spacing={2} w="full">
              <Box bg="whiteAlpha.100" p={3} borderRadius="2xl" borderTopLeftRadius="none" border="1px solid" borderColor="whiteAlpha.200">
                <HStack spacing={1}>
                  <Box w={1.5} h={1.5} bg="whiteAlpha.500" borderRadius="full" className="animate-bounce" />
                  <Box w={1.5} h={1.5} bg="whiteAlpha.500" borderRadius="full" className="animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <Box w={1.5} h={1.5} bg="whiteAlpha.500" borderRadius="full" className="animate-bounce" style={{ animationDelay: '0.4s' }} />
                </HStack>
              </Box>
              <Box w="80%" p={2}>
                <SkeletonText noOfLines={3} spacing="2" skeletonHeight="2" />
              </Box>
            </VStack>
          )}
          <div ref={chatEndRef} />
        </Box>

        {/* Error Handling UI */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Alert status="error" variant="solid" bg="red.900" color="white" borderRadius="none" py={3}>
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle fontSize="xs">Generation Failed</AlertTitle>
                  <AlertDescription fontSize="10px" display="block">
                    {error}
                  </AlertDescription>
                </Box>
                <Button 
                  size="xs" 
                  colorScheme="whiteAlpha" 
                  leftIcon={<RefreshCw size={12} />}
                  onClick={retryLastAction}
                  ml={2}
                >
                  Retry
                </Button>
                <CloseButton 
                  size="sm" 
                  position="absolute" 
                  right="2px" 
                  top="2px" 
                  onClick={() => setError(null)} 
                />
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <Box p={4} borderTop="1px solid" borderColor="whiteAlpha.100" bg="#0d0d11">
          <Box position="relative">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={html ? "Ask for changes..." : (generationMode === 'website' ? "Describe your site..." : "Describe your component...")}
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.200"
              borderRadius="xl"
              p={3}
              pr={12}
              fontSize="xs"
              _focus={{ borderColor: 'blue.500', ring: 1, ringColor: 'blue.500/50' }}
              resize="none"
              h="100px"
              isDisabled={isLoading}
            />
            <IconButton
              aria-label="Send"
              icon={<Send size={18} />}
              position="absolute"
              right={2}
              bottom={2}
              colorScheme="blue"
              size="sm"
              onClick={handleSend}
              isDisabled={isLoading || !userInput.trim()}
            />
          </Box>
          <Text fontSize="10px" color="whiteAlpha.400" mt={2} textAlign="center">
            Press Enter to send. Shift+Enter for new line.
          </Text>
        </Box>
      </Box>

      {/* Main Preview Panel */}
      <Flex flex={1} direction="column" bg="#050507">
        <Flex h={14} borderBottom="1px solid" borderColor="whiteAlpha.100" align="center" justify="space-between" px={4} bg="#0d0d11">
          <HStack spacing={4}>
            <HStack bg="whiteAlpha.50" p={1} borderRadius="lg">
              <Button
                size="xs"
                variant={activeTab === 'preview' ? 'solid' : 'ghost'}
                bg={activeTab === 'preview' ? 'whiteAlpha.200' : 'transparent'}
                onClick={() => setActiveTab('preview')}
                leftIcon={<Eye size={14} />}
                fontSize="xs"
              >
                Preview
              </Button>
              <Button
                size="xs"
                variant={activeTab === 'code' ? 'solid' : 'ghost'}
                bg={activeTab === 'code' ? 'whiteAlpha.200' : 'transparent'}
                onClick={() => setActiveTab('code')}
                leftIcon={<Code size={14} />}
                fontSize="xs"
              >
                Code
              </Button>
            </HStack>

            <HStack spacing={1} borderLeft="1px solid" borderColor="whiteAlpha.100" pl={4}>
              <Tooltip label="Undo">
                <IconButton aria-label="Undo" icon={<Undo2 size={16} />} size="xs" variant="ghost" isDisabled={historyIndex <= 0 || isLoading} onClick={undo} />
              </Tooltip>
              <Tooltip label="Redo">
                <IconButton aria-label="Redo" icon={<Redo2 size={16} />} size="xs" variant="ghost" isDisabled={historyIndex >= undoHistory.length - 1 || isLoading} onClick={redo} />
              </Tooltip>
            </HStack>

            {activeTab === 'preview' && (
              <HStack spacing={1} borderLeft="1px solid" borderColor="whiteAlpha.100" pl={4}>
                <IconButton aria-label="Desktop" icon={<Monitor size={16} />} size="xs" variant={previewMode === 'desktop' ? 'solid' : 'ghost'} colorScheme={previewMode === 'desktop' ? 'blue' : 'gray'} onClick={() => setPreviewMode('desktop')} />
                <IconButton aria-label="Tablet" icon={<Tablet size={16} />} size="xs" variant={previewMode === 'tablet' ? 'solid' : 'ghost'} colorScheme={previewMode === 'tablet' ? 'blue' : 'gray'} onClick={() => setPreviewMode('tablet')} />
                <IconButton aria-label="Mobile" icon={<Smartphone size={16} />} size="xs" variant={previewMode === 'mobile' ? 'solid' : 'ghost'} colorScheme={previewMode === 'mobile' ? 'blue' : 'gray'} onClick={() => setPreviewMode('mobile')} />
              </HStack>
            )}
          </HStack>

          <HStack spacing={2}>
            <Button
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              onClick={handleRefactor}
              isDisabled={!html || isLoading}
              variant="outline"
              borderColor="whiteAlpha.200"
              fontSize="xs"
              colorScheme="cyan"
            >
              Refactor
            </Button>
            <Button
              size="sm"
              leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={copyToClipboard}
              isDisabled={!html}
              variant="outline"
              borderColor="whiteAlpha.200"
              fontSize="xs"
              colorScheme={copied ? 'green' : 'gray'}
            >
              {copied ? 'Copied' : 'Copy Code'}
            </Button>
          </HStack>
        </Flex>

        {isLoading && <Progress size="xs" isIndeterminate colorScheme="blue" bg="transparent" />}

        <Box flex={1} position="relative" p={4} display="flex" alignItems="center" justifyContent="center">
          <AnimatePresence mode="wait">
            {activeTab === 'preview' ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}
              >
                {!html && !isLoading ? (
                  <VStack spacing={4} opacity={0.2} justify="center">
                    <Layout size={80} />
                    <Text fontSize="xl" fontWeight="bold">No {generationMode} generated yet</Text>
                  </VStack>
                ) : isLoading && !html ? (
                  <VStack w="full" h="full" spacing={6} justify="center">
                    <Skeleton w={getIframeWidth()} h="full" borderRadius="xl" />
                    <VStack spacing={2} w="300px">
                      <Text fontSize="xs" color="whiteAlpha.500">Generating initial {generationMode}...</Text>
                      <Progress w="full" size="xs" isIndeterminate borderRadius="full" colorScheme="blue" />
                    </VStack>
                  </VStack>
                ) : (
                  <Box 
                    bg="white" 
                    borderRadius="xl" 
                    boxShadow="2xl" 
                    overflow="hidden" 
                    transition="all 0.5s"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    w={getIframeWidth()}
                    h="full"
                    position="relative"
                  >
                    {isLoading && (
                      <Box position="absolute" inset={0} bg="whiteAlpha.700" backdropFilter="blur(2px)" zIndex={10} display="flex" alignItems="center" justifyContent="center">
                        <VStack spacing={3}>
                          <RefreshCw size={24} className="animate-spin text-blue-600" />
                          <Text color="blue.600" fontSize="xs" fontWeight="bold">Updating Preview...</Text>
                        </VStack>
                      </Box>
                    )}
                    <iframe
                      srcDoc={html}
                      title="Preview"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </Box>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ width: '100%', height: '100%' }}
              >
                <Box h="full" w="full" position="relative" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="whiteAlpha.100">
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
                    value={html}
                    onChange={(value) => setHtml(value || '')}
                    options={{
                      fontSize: settings.fontSize,
                      wordWrap: settings.wordWrap,
                      minimap: { enabled: settings.minimap },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      formatOnPaste: true,
                      formatOnType: true,
                    }}
                  />
                  {isLoading && (
                    <Box position="absolute" inset={0} bg="blackAlpha.600" backdropFilter="blur(1px)" zIndex={10} p={6}>
                      <Skeleton h="full" w="full" startColor="whiteAlpha.50" endColor="whiteAlpha.200" />
                    </Box>
                  )}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        <Flex h={8} borderTop="1px solid" borderColor="whiteAlpha.100" bg="#0d0d11" align="center" justify="space-between" px={4} fontSize="10px" color="whiteAlpha.400">
          <HStack spacing={3}>
            <HStack spacing={1}>
              <Box w={1.5} h={1.5} borderRadius="full" bg={html ? "green.500" : "whiteAlpha.300"} />
              <Text>{html ? 'Site Ready' : 'Idle'}</Text>
            </HStack>
            <Divider orientation="vertical" h={3} />
            <Text>Model: {model}</Text>
            <Divider orientation="vertical" h={3} />
            <Text>Mode: {generationMode}</Text>
          </HStack>
          <HStack spacing={3}>
            <Text>Responsive Design Enabled</Text>
            <Text>•</Text>
            <Text>Powered by Gemini 2.0</Text>
          </HStack>
        </Flex>
      </Flex>

      {/* Save Project Modal */}
      <Modal isOpen={isSaveOpen} onClose={onSaveClose}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="#1a1a24" color="white" borderColor="whiteAlpha.200" border="1px solid">
          <ModalHeader fontSize="md">Save Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="xs" color="whiteAlpha.600">Enter a name for your project to save it to local storage.</Text>
              <Input 
                placeholder="Project Name" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)}
                bg="whiteAlpha.50"
                borderColor="whiteAlpha.200"
                fontSize="sm"
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" mr={3} onClick={onSaveClose}>Cancel</Button>
            <Button size="sm" colorScheme="blue" onClick={handleSave} isDisabled={!projectName.trim()}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Load Project Modal */}
      <Modal isOpen={isLoadOpen} onClose={onLoadClose} size="xl">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="#1a1a24" color="white" borderColor="whiteAlpha.200" border="1px solid">
          <ModalHeader fontSize="md">Load Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="400px" overflowY="auto">
            {savedProjects.length === 0 ? (
              <Text fontSize="xs" color="whiteAlpha.400" textAlign="center" py={8}>No saved projects found.</Text>
            ) : (
              <VStack spacing={2} align="stretch">
                {savedProjects.map(project => (
                  <HStack key={project.id} p={3} bg="whiteAlpha.50" borderRadius="lg" justify="space-between" _hover={{ bg: 'whiteAlpha.100' }}>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold">{project.name}</Text>
                      <Text fontSize="10px" color="whiteAlpha.500">{new Date(project.timestamp).toLocaleString()} • {project.mode}</Text>
                    </VStack>
                    <HStack>
                      <Button size="xs" colorScheme="blue" onClick={() => { loadProject(project.id); onLoadClose(); }}>Load</Button>
                      <IconButton aria-label="Delete" icon={<Trash2 size={14} />} size="xs" colorScheme="red" variant="ghost" onClick={() => deleteProject(project.id)} />
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" onClick={onLoadClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="#1a1a24" color="white" borderColor="whiteAlpha.200" border="1px solid">
          <ModalHeader fontSize="md">Application Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <FormControl>
                <FormLabel fontSize="sm">AI Model</FormLabel>
                <Menu>
                  <MenuButton as={Button} size="sm" w="full" rightIcon={<ChevronDown size={14} />} bg="whiteAlpha.50" _hover={{ bg: 'whiteAlpha.100' }} textAlign="left">
                    {model === ModelType.FLASH ? 'Gemini 2.0 Flash' : 'Gemini 2.0 Pro'} {isThinking ? '(Thinking)' : ''}
                  </MenuButton>
                  <Portal>
                    <MenuList bg="#1a1a24" borderColor="whiteAlpha.200" zIndex={2000}>
                      <MenuItem 
                        bg="transparent" 
                        _hover={{ bg: 'whiteAlpha.100' }} 
                        onClick={() => { setModel(ModelType.FLASH); setIsThinking(false); }}
                        icon={<Zap size={14} />}
                      >
                        Gemini 2.0 Flash (Fast)
                      </MenuItem>
                      <MenuItem 
                        bg="transparent" 
                        _hover={{ bg: 'whiteAlpha.100' }} 
                        onClick={() => { setModel(ModelType.PRO); setIsThinking(true); }}
                        icon={<BrainCircuit size={14} />}
                      >
                        Gemini 2.0 Pro (Thinking)
                      </MenuItem>
                    </MenuList>
                  </Portal>
                </Menu>
              </FormControl>

              <Divider borderColor="whiteAlpha.100" />

              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb="0" fontSize="sm">Editor Theme (Dark)</FormLabel>
                <Switch 
                  isChecked={settings.theme === 'dark'} 
                  onChange={(e) => updateSettings({ theme: e.target.checked ? 'dark' : 'light' })} 
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb="0" fontSize="sm">Font Size</FormLabel>
                <NumberInput 
                  size="sm" 
                  maxW={20} 
                  value={settings.fontSize} 
                  onChange={(_, val) => updateSettings({ fontSize: val })}
                  min={10}
                  max={24}
                >
                  <NumberInputField bg="whiteAlpha.50" borderColor="whiteAlpha.200" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb="0" fontSize="sm">Word Wrap</FormLabel>
                <Switch 
                  isChecked={settings.wordWrap === 'on'} 
                  onChange={(e) => updateSettings({ wordWrap: e.target.checked ? 'on' : 'off' })} 
                />
              </FormControl>

              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb="0" fontSize="sm">Show Minimap</FormLabel>
                <Switch 
                  isChecked={settings.minimap} 
                  onChange={(e) => updateSettings({ minimap: e.target.checked })} 
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" colorScheme="blue" onClick={onSettingsClose}>Save & Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Versions Panel Modal */}
      <Modal isOpen={isVersionsOpen} onClose={onVersionsClose} size="md">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg="#1a1a24" color="white" borderColor="whiteAlpha.200" border="1px solid">
          <ModalHeader fontSize="md">Version History</ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="400px" overflowY="auto">
            {versions.length === 0 ? (
              <Text fontSize="xs" color="whiteAlpha.400" textAlign="center" py={8}>No versions recorded yet.</Text>
            ) : (
              <VStack spacing={3} align="stretch">
                {versions.map((v, i) => (
                  <Box 
                    key={v.id} 
                    p={3} 
                    bg="whiteAlpha.50" 
                    borderRadius="lg" 
                    cursor="pointer"
                    _hover={{ bg: 'whiteAlpha.100' }}
                    onClick={() => { revertToVersion(v.id); onVersionsClose(); }}
                    position="relative"
                  >
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" fontWeight="bold" noOfLines={1}>{v.description}</Text>
                        <Text fontSize="10px" color="whiteAlpha.500">{new Date(v.timestamp).toLocaleString()}</Text>
                      </VStack>
                      <ChevronRight size={14} />
                    </HStack>
                    {i === 0 && (
                      <Badge position="absolute" top={-2} right={2} colorScheme="green" fontSize="8px">Current</Badge>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" onClick={onVersionsClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
