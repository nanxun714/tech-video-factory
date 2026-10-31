import "./index.css";
import {Composition} from "remotion";
import {LinuxHadoopTutorial} from "./LinuxHadoopTutorial";
import {tutorialDurationInFrames} from "./linuxHadoopTutorialData";
import {TopUsMarketCapRace} from "./TopUsMarketCapRace";
import {HdfsFaultTolerance} from "./HdfsFaultTolerance";
import {SubnetMaskExplainer} from "./SubnetMaskExplainer";
import {SubnetCover} from "./SubnetCover";
import {CodeRunExplainer} from "./CodeRunExplainer";
import {LinuxBasicsTutorial} from "./LinuxBasicsTutorial";
import {DockerExitTroubleshoot} from "./DockerExitTroubleshoot";
import {VirtualMemorySketch} from "./VirtualMemorySketch";
import {FileDeleteSketch} from "./FileDeleteSketch";
import {FileDeleteCover} from "./FileDeleteCover";
import {RestartSketch} from "./RestartSketch";
import {PortMapVsTunnel} from "./PortMapVsTunnel";
import {ProcessThreadSketch} from "./ProcessThreadSketch";
import {ProcessThreadFlat} from "./ProcessThreadFlat";
import {HttpVsHttps} from "./HttpVsHttps";
import {HttpSketch} from "./HttpSketch";
import {TcpVsUdpSketch} from "./TcpVsUdpSketch";
import {TcpVsUdpCover} from "./TcpVsUdpCover";
import {TcpVsUdpFlat, DUR as TcpVsUdpFlatDuration} from "./TcpVsUdpFlat";
import {StackVsHeap, DUR as StackVsHeapDuration} from "./StackVsHeap";
import {PythonRuntimeExplainer} from "./PythonRuntimeExplainer";
import {MemLeakStory, memLeakDurationInFrames} from "./MemLeakStory";
import {MemLeakCover} from "./MemLeakCover";
import {UrlJourneySketch, DUR as UrlJourneyDuration} from "./UrlJourneySketch";
import {CtrlCopyExplainer, ctrlcDurationInFrames} from "./CtrlCopyExplainer";
import {
  subnetDurationInFrames,
  subnetHeight,
  subnetWidth,
} from "./subnetMaskExplainerData";
import {
  hdfsDurationInFrames,
  hdfsFps,
  hdfsFormat,
} from "./hdfsFaultToleranceData";
import {QrCodeFlat, DUR as QrCodeFlatDUR} from "./QrCodeFlat";
import {WifiFullBars, DUR as WifiFullBarsDUR} from "./WifiFullBars";
import {AiHallucinationFlat, DUR as AiHallucinationFlatDUR} from "./AiHallucinationFlat";
import {TokenFlat, DUR as TokenFlatDUR} from "./TokenFlat";
import {PhoneLagFlat, DUR as PhoneLagFlatDUR} from "./PhoneLagFlat";
import {TcpHandshakeSketch, DUR as TcpHandshakeSketchDUR} from "./TcpHandshakeSketch";
import {PortOccupied, DUR as PortOccupiedDUR} from "./PortOccupied";
import {Cpu100Diagnosis, DUR as Cpu100DiagnosisDUR} from "./Cpu100Diagnosis";
import {InodeExhausted, DUR as InodeExhaustedDUR} from "./InodeExhausted";
import {GetVsPost, DUR as GetVsPostDUR} from "./GetVsPost";
import {CookieSessionToken, DUR as CookieSessionTokenDUR} from "./CookieSessionToken";
import {WebCacheSketch} from "./WebCacheSketch";
import {PwdHashSketch} from "./PwdHashSketch";
import {CompressSketch} from "./CompressSketch";
import {DUR as WebCacheDUR} from "./batch10/webcacheData";
import {DUR as PwdHashDUR} from "./batch10/pwdhashData";
import {DUR as CompressDUR} from "./batch10/compressData";
import {ConcParFlat} from "./ConcParFlat";
import {RangeResumeFlat} from "./RangeResumeFlat";
import {PingOpenFail} from "./PingOpenFail";
import {ZCodeUploadDark, DUR as ZCodeUploadDUR} from "./ZCodeUploadDark";
import {ZCodeUploadShort, DUR as ZCodeUploadShortDUR} from "./ZCodeUploadShort";
import {DUR as ConcParDUR} from "./batch10/concparData";
import {DUR as RangeResumeDUR} from "./batch10/rangeresumeData";
import {DUR as PingOpenDUR} from "./batch10/pingopenData";
import {BiSheTopicFlat} from "./BiSheTopicFlat";
import {DUR as BiSheTopicDUR} from "./batch10/bisheData";
import {BiSheKaitiFlat} from "./BiSheKaitiFlat";
import {DUR as BiSheKaitiDUR} from "./batch10/kaitiData";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="SubnetMaskExplainer"
        component={SubnetMaskExplainer}
        durationInFrames={subnetDurationInFrames}
        fps={30}
        width={subnetWidth}
        height={subnetHeight}
      />
      <Composition
        id="CodeRunExplainer"
        component={CodeRunExplainer}
        durationInFrames={2016}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LinuxBasicsTutorial"
        component={LinuxBasicsTutorial}
        durationInFrames={1964}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="DockerExitTroubleshoot"
        component={DockerExitTroubleshoot}
        durationInFrames={1366}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VirtualMemorySketch"
        component={VirtualMemorySketch}
        durationInFrames={1780}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FileDeleteSketch"
        component={FileDeleteSketch}
        durationInFrames={2066}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="FileDeleteCover"
        component={FileDeleteCover}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1440}
      />
      <Composition
        id="RestartSketch"
        component={RestartSketch}
        durationInFrames={2045}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PortMapVsTunnel"
        component={PortMapVsTunnel}
        durationInFrames={1860}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProcessThreadSketch"
        component={ProcessThreadSketch}
        durationInFrames={2484}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProcessThreadFlat"
        component={ProcessThreadFlat}
        durationInFrames={1424}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HttpSketch"
        component={HttpSketch}
        durationInFrames={1906}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TcpVsUdpFlat"
        component={TcpVsUdpFlat}
        durationInFrames={TcpVsUdpFlatDuration}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="StackVsHeap"
        component={StackVsHeap}
        durationInFrames={StackVsHeapDuration}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PythonRuntimeExplainer"
        component={PythonRuntimeExplainer}
        durationInFrames={1165}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TcpVsUdpSketch"
        component={TcpVsUdpSketch}
        durationInFrames={1900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TcpVsUdpCover"
        component={TcpVsUdpCover}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1440}
      />
      <Composition
        id="HttpVsHttps"
        component={HttpVsHttps}
        durationInFrames={1906}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SubnetCover"
        component={SubnetCover}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1440}
      />
      <Composition
        id="LinuxHadoopTutorial"
        component={LinuxHadoopTutorial}
        durationInFrames={tutorialDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TopUsMarketCapRace"
        component={TopUsMarketCapRace}
        durationInFrames={32 * 30}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MemLeakStory"
        component={MemLeakStory}
        durationInFrames={memLeakDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="MemLeakCover"
        component={MemLeakCover}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1440}
      />
      <Composition
        id="UrlJourneySketch"
        component={UrlJourneySketch}
        durationInFrames={UrlJourneyDuration}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CtrlCopyExplainer"
        component={CtrlCopyExplainer}
        durationInFrames={ctrlcDurationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HdfsFaultTolerance"
        component={HdfsFaultTolerance}
        durationInFrames={hdfsDurationInFrames}
        fps={hdfsFps}
        width={hdfsFormat.width}
        height={hdfsFormat.height}
      />
      <Composition
        id="QrCodeFlat"
        component={QrCodeFlat}
        durationInFrames={QrCodeFlatDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="WifiFullBars"
        component={WifiFullBars}
        durationInFrames={WifiFullBarsDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="AiHallucinationFlat"
        component={AiHallucinationFlat}
        durationInFrames={AiHallucinationFlatDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TokenFlat"
        component={TokenFlat}
        durationInFrames={TokenFlatDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PhoneLagFlat"
        component={PhoneLagFlat}
        durationInFrames={PhoneLagFlatDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TcpHandshakeSketch"
        component={TcpHandshakeSketch}
        durationInFrames={TcpHandshakeSketchDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PortOccupied"
        component={PortOccupied}
        durationInFrames={PortOccupiedDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Cpu100Diagnosis"
        component={Cpu100Diagnosis}
        durationInFrames={Cpu100DiagnosisDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="InodeExhausted"
        component={InodeExhausted}
        durationInFrames={InodeExhaustedDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="GetVsPost"
        component={GetVsPost}
        durationInFrames={GetVsPostDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CookieSessionToken"
        component={CookieSessionToken}
        durationInFrames={CookieSessionTokenDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="WebCacheSketch"
        component={WebCacheSketch}
        durationInFrames={WebCacheDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PwdHashSketch"
        component={PwdHashSketch}
        durationInFrames={PwdHashDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="CompressSketch"
        component={CompressSketch}
        durationInFrames={CompressDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ConcParFlat"
        component={ConcParFlat}
        durationInFrames={ConcParDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RangeResumeFlat"
        component={RangeResumeFlat}
        durationInFrames={RangeResumeDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="PingOpenFail"
        component={PingOpenFail}
        durationInFrames={PingOpenDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BiSheTopicFlat"
        component={BiSheTopicFlat}
        durationInFrames={BiSheTopicDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BiSheKaitiFlat"
        component={BiSheKaitiFlat}
        durationInFrames={BiSheKaitiDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ZCodeUploadDark"
        component={ZCodeUploadDark}
        durationInFrames={ZCodeUploadDUR}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ZCodeUploadShort"
        component={ZCodeUploadShort}
        durationInFrames={ZCodeUploadShortDUR}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
