using UnityEngine;

public class InnoParkInteriorGenerator : MonoBehaviour
{
    private Transform root;

    private Material wallMat;
    private Material darkWallMat;
    private Material floorMat;
    private Material ceilingMat;
    private Material logoGreenMat;
    private Material glassMat;
    private Material darkGlassMat;
    private Material woodMat;
    private Material whiteMat;
    private Material blackMat;
    private Material metalMat;
    private Material blueLightMat;
    private Material redLightMat;
    private Material screenMat;
    private Material bloodMat;
    private Material coffeeMat;
    private Material paperMat;

    [ContextMenu("Generate InnoPark Interior")]
    public void Generate()
    {
        ClearOld();
        CreateMaterials();

        GameObject rootObj = new GameObject("INNOPARK_INTERIOR_MODEL");
        root = rootObj.transform;

        CreateLobbyShell();
        CreateLogoWall();
        CreateReceptionDesk();
        CreateColumnsAndGallery();
        CreateGlassRailings();
        CreateSecurityCorner();
        CreateBreakRoom();
        CreateMainCorridor();
        CreateSoftwareLab();
        CreatePrototypeRoom();
        CreateStoryClues();
        CreateLights();
        CreateCamera();
    }

    private void ClearOld()
    {
        GameObject old = GameObject.Find("INNOPARK_INTERIOR_MODEL");

        if (old != null)
        {
            if (Application.isPlaying)
                Destroy(old);
            else
                DestroyImmediate(old);
        }
    }

    private void CreateMaterials()
    {
        wallMat = MakeMat("Lobby_WarmWhite_Wall", new Color(0.78f, 0.77f, 0.72f));
        darkWallMat = MakeMat("Lobby_DarkGrey_LogoWall", new Color(0.28f, 0.30f, 0.31f));
        floorMat = MakeMat("Lobby_Grey_TileFloor", new Color(0.44f, 0.45f, 0.44f));
        ceilingMat = MakeMat("Lobby_Dark_Ceiling", new Color(0.12f, 0.13f, 0.15f));
        logoGreenMat = MakeMat("InnoPark_Logo_Green", new Color(0.00f, 0.42f, 0.20f));
        glassMat = MakeMat("Interior_Glass_BlueTransparent", new Color(0.35f, 0.65f, 0.85f, 0.32f), true);
        darkGlassMat = MakeMat("Interior_DarkGlass", new Color(0.03f, 0.10f, 0.16f, 0.55f), true);
        woodMat = MakeMat("Reception_Wood", new Color(0.42f, 0.24f, 0.12f));
        whiteMat = MakeMat("Clean_White_Surface", new Color(0.92f, 0.92f, 0.88f));
        blackMat = MakeMat("Black_Detail", new Color(0.02f, 0.02f, 0.025f));
        metalMat = MakeMat("Metal_Grey", new Color(0.55f, 0.56f, 0.55f));
        blueLightMat = MakeEmissionMat("Blue_Guide_Light_Mat", new Color(0.05f, 0.32f, 1f), 1.8f);
        redLightMat = MakeEmissionMat("Red_Emergency_Light_Mat", new Color(0.9f, 0.02f, 0.02f), 2.0f);
        screenMat = MakeEmissionMat("Monitor_ColdWhite_Screen", new Color(0.72f, 0.88f, 1f), 1.5f);
        bloodMat = MakeMat("Story_Blood_DarkRed", new Color(0.35f, 0.00f, 0.00f));
        coffeeMat = MakeMat("Coffee_Dark", new Color(0.16f, 0.08f, 0.03f));
        paperMat = MakeMat("Paper_White", new Color(0.93f, 0.91f, 0.84f));
    }

    private Material MakeMat(string name, Color color, bool transparent = false)
    {
        Shader shader = Shader.Find("Universal Render Pipeline/Lit");
        if (shader == null)
            shader = Shader.Find("Standard");

        Material mat = new Material(shader);
        mat.name = name;
        mat.color = color;

        if (transparent)
        {
            mat.SetFloat("_Surface", 1);
            mat.SetFloat("_AlphaClip", 0);
            mat.SetFloat("_SrcBlend", (float)UnityEngine.Rendering.BlendMode.SrcAlpha);
            mat.SetFloat("_DstBlend", (float)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
            mat.SetFloat("_ZWrite", 0);
            mat.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
            mat.renderQueue = 3000;
        }

        return mat;
    }

    private Material MakeEmissionMat(string name, Color color, float intensity)
    {
        Shader shader = Shader.Find("Universal Render Pipeline/Lit");
        if (shader == null)
            shader = Shader.Find("Standard");

        Material mat = new Material(shader);
        mat.name = name;
        mat.color = color;

        if (mat.HasProperty("_EmissionColor"))
        {
            mat.EnableKeyword("_EMISSION");
            mat.SetColor("_EmissionColor", color * intensity);
        }

        return mat;
    }

    private GameObject Cube(string name, Vector3 position, Vector3 scale, Material mat)
    {
        GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
        obj.name = name;
        obj.transform.SetParent(root);
        obj.transform.position = position;
        obj.transform.localScale = scale;

        if (mat != null)
            obj.GetComponent<Renderer>().material = mat;

        return obj;
    }

    private GameObject Cylinder(string name, Vector3 position, Vector3 scale, Material mat)
    {
        GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        obj.name = name;
        obj.transform.SetParent(root);
        obj.transform.position = position;
        obj.transform.localScale = scale;

        if (mat != null)
            obj.GetComponent<Renderer>().material = mat;

        return obj;
    }

    private GameObject Sphere(string name, Vector3 position, Vector3 scale, Material mat)
    {
        GameObject obj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        obj.name = name;
        obj.transform.SetParent(root);
        obj.transform.position = position;
        obj.transform.localScale = scale;

        if (mat != null)
            obj.GetComponent<Renderer>().material = mat;

        return obj;
    }

    private void CreateLobbyShell()
    {
        Cube("Lobby_Floor_GriSeramikZemin", new Vector3(0, 0, 4), new Vector3(24, 0.18f, 30), floorMat);
        Cube("Lobby_Ceiling_KoyuTavan", new Vector3(0, 6.2f, 4), new Vector3(24, 0.25f, 30), ceilingMat);

        Cube("Lobby_BackWall_GriLogoDuvari", new Vector3(0, 3.1f, 17.1f), new Vector3(22, 6.2f, 0.35f), darkWallMat);
        Cube("Lobby_LeftWall_BeyazDuvar", new Vector3(-12.1f, 3.1f, 4), new Vector3(0.35f, 6.2f, 30), wallMat);
        Cube("Lobby_RightWall_BeyazDuvar", new Vector3(12.1f, 3.1f, 4), new Vector3(0.35f, 6.2f, 30), wallMat);

        Cube("Lobby_Entrance_GlassDoor_Left", new Vector3(-1.6f, 2.0f, -11.1f), new Vector3(1.4f, 3.7f, 0.18f), darkGlassMat);
        Cube("Lobby_Entrance_GlassDoor_Right", new Vector3(1.6f, 2.0f, -11.1f), new Vector3(1.4f, 3.7f, 0.18f), darkGlassMat);
        Cube("Lobby_Entrance_MetalFrame_Top", new Vector3(0, 3.95f, -11.2f), new Vector3(5.2f, 0.18f, 0.22f), metalMat);
        Cube("Lobby_Entrance_MetalFrame_Left", new Vector3(-2.6f, 2.0f, -11.2f), new Vector3(0.16f, 3.9f, 0.22f), metalMat);
        Cube("Lobby_Entrance_MetalFrame_Right", new Vector3(2.6f, 2.0f, -11.2f), new Vector3(0.16f, 3.9f, 0.22f), metalMat);

        Cube("Lobby_Floor_DarkEntranceMat", new Vector3(0, 0.12f, -8.5f), new Vector3(7.0f, 0.04f, 3.0f), blackMat);
    }

    private void CreateLogoWall()
    {
        Cube("Lobby_LogoWall_BeyazTabelaPanel", new Vector3(0, 3.55f, 16.85f), new Vector3(9.0f, 2.2f, 0.16f), whiteMat);

        GameObject logo = new GameObject("Lobby_InnoParkLogo_Yazi");
        logo.transform.SetParent(root);
        logo.transform.position = new Vector3(0, 3.7f, 16.65f);
        logo.transform.rotation = Quaternion.Euler(0, 0, 0);

        TextMesh text = logo.AddComponent<TextMesh>();
        text.text = "InnoPark";
        text.anchor = TextAnchor.MiddleCenter;
        text.alignment = TextAlignment.Center;
        text.characterSize = 0.65f;
        text.fontSize = 110;
        text.color = new Color(0.00f, 0.42f, 0.20f);

        Cube("Lobby_InnoParkLogo_AltYesilCizgi", new Vector3(0, 2.45f, 16.58f), new Vector3(8.2f, 0.10f, 0.08f), logoGreenMat);

        Cube("Lobby_LogoWall_SolDekorPanel", new Vector3(-8.2f, 3.1f, 16.75f), new Vector3(2.2f, 4.8f, 0.12f), wallMat);
        Cube("Lobby_LogoWall_SagDekorPanel", new Vector3(8.2f, 3.1f, 16.75f), new Vector3(2.2f, 4.8f, 0.12f), wallMat);
    }

    private void CreateReceptionDesk()
    {
        GameObject deskRoot = new GameObject("Lobby_Reception_Banko_Acili");
        deskRoot.transform.SetParent(root);

        GameObject main = Cube("Lobby_Reception_AnaBanko", new Vector3(0, 0.85f, 11.3f), new Vector3(7.8f, 1.5f, 1.6f), woodMat);
        main.transform.SetParent(deskRoot.transform);

        GameObject leftWing = Cube("Lobby_Reception_SolAciliKanat", new Vector3(-4.15f, 0.85f, 10.55f), new Vector3(2.9f, 1.5f, 1.45f), woodMat);
        leftWing.transform.rotation = Quaternion.Euler(0, -18, 0);
        leftWing.transform.SetParent(deskRoot.transform);

        GameObject rightWing = Cube("Lobby_Reception_SagAciliKanat", new Vector3(4.15f, 0.85f, 10.55f), new Vector3(2.9f, 1.5f, 1.45f), woodMat);
        rightWing.transform.rotation = Quaternion.Euler(0, 18, 0);
        rightWing.transform.SetParent(deskRoot.transform);

        Cube("Lobby_Reception_BeyazUstTabla", new Vector3(0, 1.68f, 11.3f), new Vector3(8.4f, 0.18f, 1.9f), whiteMat);
        Cube("Lobby_Reception_OnBeyazSerit", new Vector3(0, 1.28f, 10.45f), new Vector3(7.4f, 0.16f, 0.12f), whiteMat);
        Cube("Lobby_Reception_AltGolge", new Vector3(0, 0.16f, 10.45f), new Vector3(7.6f, 0.20f, 0.14f), blackMat);

        Cube("Lobby_Reception_ComputerMonitor_01", new Vector3(-1.5f, 2.05f, 11.3f), new Vector3(0.9f, 0.55f, 0.08f), screenMat);
        Cube("Lobby_Reception_ComputerStand_01", new Vector3(-1.5f, 1.75f, 11.35f), new Vector3(0.12f, 0.45f, 0.12f), blackMat);

        Cube("Lobby_Reception_ComputerMonitor_02", new Vector3(1.5f, 2.05f, 11.3f), new Vector3(0.9f, 0.55f, 0.08f), screenMat);
        Cube("Lobby_Reception_ComputerStand_02", new Vector3(1.5f, 1.75f, 11.35f), new Vector3(0.12f, 0.45f, 0.12f), blackMat);

        CreateCoffeeCup("Lobby_Reception_CoffeeCup_01", new Vector3(3.0f, 1.88f, 10.85f));
        CreateRadio("Lobby_Reception_Telsiz", new Vector3(-3.0f, 1.88f, 10.85f));
    }

    private void CreateColumnsAndGallery()
    {
        Cylinder("Lobby_Column_Left_White", new Vector3(-8.2f, 3.0f, 6.5f), new Vector3(0.38f, 3.0f, 0.38f), whiteMat);
        Cylinder("Lobby_Column_Right_White", new Vector3(8.2f, 3.0f, 6.5f), new Vector3(0.38f, 3.0f, 0.38f), whiteMat);

        Cylinder("Lobby_Column_BackLeft_White", new Vector3(-8.2f, 3.0f, 13.5f), new Vector3(0.34f, 3.0f, 0.34f), whiteMat);
        Cylinder("Lobby_Column_BackRight_White", new Vector3(8.2f, 3.0f, 13.5f), new Vector3(0.34f, 3.0f, 0.34f), whiteMat);

        Cube("Lobby_UpperGallery_LeftFloor", new Vector3(-7.0f, 4.2f, 8.5f), new Vector3(4.0f, 0.22f, 12.0f), floorMat);
        Cube("Lobby_UpperGallery_RightFloor", new Vector3(7.0f, 4.2f, 8.5f), new Vector3(4.0f, 0.22f, 12.0f), floorMat);

        Cube("Lobby_UpperGallery_BackBridge", new Vector3(0, 4.2f, 14.0f), new Vector3(16.0f, 0.22f, 2.2f), floorMat);

        Cube("Lobby_StairHint_LeftBlock", new Vector3(-10.1f, 1.0f, 1.5f), new Vector3(1.4f, 0.25f, 4.0f), wallMat);
        Cube("Lobby_StairHint_LeftStep_01", new Vector3(-9.5f, 0.28f, -1.4f), new Vector3(2.4f, 0.25f, 0.6f), whiteMat);
        Cube("Lobby_StairHint_LeftStep_02", new Vector3(-9.5f, 0.55f, -0.8f), new Vector3(2.4f, 0.25f, 0.6f), whiteMat);
        Cube("Lobby_StairHint_LeftStep_03", new Vector3(-9.5f, 0.82f, -0.2f), new Vector3(2.4f, 0.25f, 0.6f), whiteMat);
    }

    private void CreateGlassRailings()
    {
        Cube("Lobby_GlassRailing_Left_Lower", new Vector3(-5.0f, 1.15f, 3.4f), new Vector3(0.12f, 1.3f, 8.0f), glassMat);
        Cube("Lobby_GlassRailing_Right_Lower", new Vector3(5.0f, 1.15f, 3.4f), new Vector3(0.12f, 1.3f, 8.0f), glassMat);

        Cube("Lobby_GlassRailing_Left_Upper", new Vector3(-4.8f, 4.95f, 8.5f), new Vector3(0.12f, 1.25f, 10.0f), glassMat);
        Cube("Lobby_GlassRailing_Right_Upper", new Vector3(4.8f, 4.95f, 8.5f), new Vector3(0.12f, 1.25f, 10.0f), glassMat);

        Cube("Lobby_Railing_MetalTop_Left", new Vector3(-5.0f, 1.85f, 3.4f), new Vector3(0.16f, 0.08f, 8.1f), metalMat);
        Cube("Lobby_Railing_MetalTop_Right", new Vector3(5.0f, 1.85f, 3.4f), new Vector3(0.16f, 0.08f, 8.1f), metalMat);

        Cube("Lobby_UpperRailing_MetalTop_Left", new Vector3(-4.8f, 5.65f, 8.5f), new Vector3(0.16f, 0.08f, 10.0f), metalMat);
        Cube("Lobby_UpperRailing_MetalTop_Right", new Vector3(4.8f, 5.65f, 8.5f), new Vector3(0.16f, 0.08f, 10.0f), metalMat);
    }

    private void CreateSecurityCorner()
    {
        Cube("Lobby_SecurityDesk_GuvenlikMasasi", new Vector3(-8.2f, 0.72f, -4.5f), new Vector3(3.6f, 1.2f, 1.5f), woodMat);
        Cube("Lobby_SecurityDesk_UstTabla", new Vector3(-8.2f, 1.38f, -4.5f), new Vector3(3.9f, 0.16f, 1.8f), whiteMat);
        Cube("Lobby_SecurityMonitor_01", new Vector3(-8.7f, 1.85f, -4.8f), new Vector3(0.75f, 0.48f, 0.08f), screenMat);
        Cube("Lobby_SecurityMonitor_02", new Vector3(-7.7f, 1.85f, -4.8f), new Vector3(0.75f, 0.48f, 0.08f), screenMat);
        CreateRadio("Lobby_Security_Telsiz", new Vector3(-9.4f, 1.55f, -4.0f));
        CreateFlashlight("Lobby_Security_Fener", new Vector3(-7.0f, 1.55f, -4.0f));
    }

    private void CreateBreakRoom()
    {
        Cube("BreakRoom_DinlenmeOdasi_Floor", new Vector3(18, 0.02f, 4.5f), new Vector3(9, 0.12f, 9), floorMat);
        Cube("BreakRoom_BackWall", new Vector3(18, 2.2f, 9.05f), new Vector3(9, 4.4f, 0.25f), wallMat);
        Cube("BreakRoom_RightWall", new Vector3(22.55f, 2.2f, 4.5f), new Vector3(0.25f, 4.4f, 9), wallMat);
        Cube("BreakRoom_LeftGlassWall", new Vector3(13.45f, 2.2f, 4.5f), new Vector3(0.18f, 4.0f, 9), glassMat);
        Cube("BreakRoom_Ceiling", new Vector3(18, 4.45f, 4.5f), new Vector3(9, 0.18f, 9), ceilingMat);

        Cube("BreakRoom_Table_KahveMasasi", new Vector3(18, 0.75f, 4.5f), new Vector3(3.6f, 0.25f, 2.0f), woodMat);
        Cube("BreakRoom_Table_Leg_01", new Vector3(16.5f, 0.35f, 3.7f), new Vector3(0.18f, 0.65f, 0.18f), metalMat);
        Cube("BreakRoom_Table_Leg_02", new Vector3(19.5f, 0.35f, 3.7f), new Vector3(0.18f, 0.65f, 0.18f), metalMat);
        Cube("BreakRoom_Table_Leg_03", new Vector3(16.5f, 0.35f, 5.3f), new Vector3(0.18f, 0.65f, 0.18f), metalMat);
        Cube("BreakRoom_Table_Leg_04", new Vector3(19.5f, 0.35f, 5.3f), new Vector3(0.18f, 0.65f, 0.18f), metalMat);

        CreateCoffeeCup("BreakRoom_CoffeeCup_01", new Vector3(17.1f, 0.98f, 4.2f));
        CreateCoffeeCup("BreakRoom_CoffeeCup_02", new Vector3(18.0f, 0.98f, 4.8f));
        CreateCoffeeCup("BreakRoom_CoffeeCup_03", new Vector3(18.8f, 0.98f, 4.1f));

        CreateChair("BreakRoom_Chair_01", new Vector3(16.2f, 0.55f, 6.1f), 0);
        CreateChair("BreakRoom_Chair_02", new Vector3(19.8f, 0.55f, 6.1f), 0);
        CreateChair("BreakRoom_Chair_03", new Vector3(18.0f, 0.55f, 2.8f), 180);

        Cube("BreakRoom_WallClock", new Vector3(18, 2.9f, 8.85f), new Vector3(0.8f, 0.8f, 0.08f), whiteMat);
    }

    private void CreateMainCorridor()
    {
        Cube("MainCorridor_Floor_AnaKoridor", new Vector3(0, 0.02f, 25), new Vector3(10, 0.12f, 24), floorMat);
        Cube("MainCorridor_LeftWall", new Vector3(-5.1f, 2.2f, 25), new Vector3(0.25f, 4.4f, 24), wallMat);
        Cube("MainCorridor_RightWall", new Vector3(5.1f, 2.2f, 25), new Vector3(0.25f, 4.4f, 24), wallMat);
        Cube("MainCorridor_Ceiling", new Vector3(0, 4.45f, 25), new Vector3(10, 0.18f, 24), ceilingMat);

        Cube("MainCorridor_EntranceOpening_FrameTop", new Vector3(0, 4.2f, 17.3f), new Vector3(9.5f, 0.25f, 0.4f), whiteMat);

        for (int i = 0; i < 6; i++)
        {
            float z = 18.5f + i * 3.6f;
            Cube("MainCorridor_BlueGuideLight_Left_" + (i + 1), new Vector3(-4.9f, 0.65f, z), new Vector3(0.08f, 0.18f, 0.8f), blueLightMat);
            Cube("MainCorridor_BlueGuideLight_Right_" + (i + 1), new Vector3(4.9f, 0.65f, z), new Vector3(0.08f, 0.18f, 0.8f), blueLightMat);
        }

        CreateDoor("MainCorridor_Door_PrototypeRoom", new Vector3(-5.25f, 1.65f, 24.5f), 90, "PROTOTİP");
        CreateDoor("MainCorridor_Door_SoftwareLab", new Vector3(5.25f, 1.65f, 31.5f), -90, "YAZILIM LAB.");
        CreateDoor("MainCorridor_Door_OfficeClosed", new Vector3(-5.25f, 1.65f, 32.5f), 90, "OFİS");
    }

    private void CreateSoftwareLab()
    {
        Cube("SoftwareLab_Floor_YazilimLaboratuvari", new Vector3(13.5f, 0.02f, 33), new Vector3(13, 0.12f, 12), floorMat);
        Cube("SoftwareLab_BackWall", new Vector3(13.5f, 2.2f, 39.1f), new Vector3(13, 4.4f, 0.25f), wallMat);
        Cube("SoftwareLab_RightWall", new Vector3(20.1f, 2.2f, 33), new Vector3(0.25f, 4.4f, 12), wallMat);
        Cube("SoftwareLab_GlassWall_CorridorSide", new Vector3(6.9f, 2.2f, 33), new Vector3(0.18f, 4.0f, 12), darkGlassMat);
        Cube("SoftwareLab_Ceiling", new Vector3(13.5f, 4.45f, 33), new Vector3(13, 0.18f, 12), ceilingMat);

        Cube("SoftwareLab_GlassWall_ReflectionPanel", new Vector3(13.5f, 2.35f, 27.0f), new Vector3(8.5f, 3.5f, 0.12f), darkGlassMat);

        for (int i = 0; i < 4; i++)
        {
            float x = 10.0f + (i % 2) * 4.0f;
            float z = 31.0f + (i / 2) * 3.2f;

            Cube("SoftwareLab_Desk_" + (i + 1), new Vector3(x, 0.75f, z), new Vector3(2.6f, 0.25f, 1.2f), woodMat);
            Cube("SoftwareLab_Monitor_" + (i + 1), new Vector3(x, 1.35f, z - 0.35f), new Vector3(0.9f, 0.55f, 0.08f), screenMat);
            Cube("SoftwareLab_Keyboard_" + (i + 1), new Vector3(x, 0.93f, z + 0.1f), new Vector3(0.9f, 0.05f, 0.28f), blackMat);
            CreateChair("SoftwareLab_Chair_" + (i + 1), new Vector3(x, 0.45f, z + 1.0f), 180);
        }

        Cube("SoftwareLab_ServerRack_01", new Vector3(18.8f, 1.6f, 37.5f), new Vector3(1.0f, 3.0f, 1.2f), blackMat);
        Cube("SoftwareLab_ServerRack_02", new Vector3(17.5f, 1.6f, 37.5f), new Vector3(1.0f, 3.0f, 1.2f), blackMat);

        for (int i = 0; i < 5; i++)
        {
            Cube("SoftwareLab_ServerLed_Blue_" + (i + 1), new Vector3(18.25f, 0.7f + i * 0.45f, 36.85f), new Vector3(0.12f, 0.08f, 0.05f), blueLightMat);
        }
    }

    private void CreatePrototypeRoom()
    {
        Cube("PrototypeRoom_Floor_PrototipOdasi", new Vector3(-13.5f, 0.02f, 25), new Vector3(13, 0.12f, 11), floorMat);
        Cube("PrototypeRoom_BackWall", new Vector3(-13.5f, 2.2f, 30.6f), new Vector3(13, 4.4f, 0.25f), wallMat);
        Cube("PrototypeRoom_LeftWall", new Vector3(-20.1f, 2.2f, 25), new Vector3(0.25f, 4.4f, 11), wallMat);
        Cube("PrototypeRoom_GlassWall_CorridorSide", new Vector3(-6.9f, 2.2f, 25), new Vector3(0.18f, 4.0f, 11), darkGlassMat);
        Cube("PrototypeRoom_Ceiling", new Vector3(-13.5f, 4.45f, 25), new Vector3(13, 0.18f, 11), ceilingMat);

        Cube("PrototypeRoom_WorkTable", new Vector3(-13.5f, 0.8f, 25.5f), new Vector3(5.5f, 0.28f, 2.2f), metalMat);
        Cube("PrototypeRoom_Box_01", new Vector3(-15.2f, 1.1f, 25.2f), new Vector3(1.0f, 0.6f, 0.8f), woodMat);
        Cube("PrototypeRoom_Box_02", new Vector3(-12.8f, 1.1f, 25.7f), new Vector3(0.9f, 0.6f, 0.9f), woodMat);
        Cube("PrototypeRoom_ToolCabinet", new Vector3(-18.7f, 1.3f, 28.5f), new Vector3(1.2f, 2.4f, 0.8f), metalMat);
    }

    private void CreateStoryClues()
    {
        Cube("Story_BloodTrail_Corridor_01", new Vector3(-1.6f, 0.14f, 26.5f), new Vector3(1.6f, 0.035f, 0.45f), bloodMat);
        Cube("Story_BloodTrail_Corridor_02", new Vector3(-2.5f, 0.14f, 27.4f), new Vector3(1.2f, 0.035f, 0.35f), bloodMat);
        Cube("Story_BloodTrail_Corridor_03", new Vector3(-3.1f, 0.14f, 28.3f), new Vector3(0.9f, 0.035f, 0.28f), bloodMat);

        CreateFlashlight("Story_DroppedFlashlight_Orhan", new Vector3(-3.6f, 0.25f, 29.0f));
        Cube("Story_DroppedRadio_Murat", new Vector3(2.7f, 0.22f, 28.0f), new Vector3(0.42f, 0.16f, 0.72f), blackMat);
        Cube("Story_WallScratch_LightMark", new Vector3(-5.0f, 2.4f, 28.5f), new Vector3(0.05f, 0.12f, 2.2f), screenMat);

        Cube("Story_FinalShadow_CreatureSilhouette", new Vector3(13.5f, 2.2f, 38.85f), new Vector3(1.0f, 2.8f, 0.08f), blackMat);
        Cube("Story_FinalShadow_LongArm_Left", new Vector3(12.6f, 2.3f, 38.8f), new Vector3(1.4f, 0.16f, 0.08f), blackMat);
        Cube("Story_FinalShadow_LongArm_Right", new Vector3(14.4f, 2.3f, 38.8f), new Vector3(1.4f, 0.16f, 0.08f), blackMat);
    }

    private void CreateLights()
    {
        RenderSettings.ambientLight = new Color(0.025f, 0.035f, 0.055f);

        GameObject mainLightObj = new GameObject("Interior_Base_LowBlueLight");
        mainLightObj.transform.SetParent(root);
        Light mainLight = mainLightObj.AddComponent<Light>();
        mainLight.type = LightType.Directional;
        mainLight.intensity = 0.08f;
        mainLight.color = new Color(0.45f, 0.52f, 0.65f);
        mainLightObj.transform.rotation = Quaternion.Euler(20, -45, 0);

        CreatePointLight("Lobby_Reception_SoftWhiteLight", new Vector3(0, 3.2f, 11), new Color(0.75f, 0.85f, 1f), 2.0f, 7);
        CreatePointLight("Lobby_BlueGuideLight_Main", new Vector3(0, 1.2f, 1), new Color(0.05f, 0.25f, 1f), 1.3f, 8);
        CreatePointLight("Lobby_RedEmergencyLight", new Vector3(7.8f, 3.4f, 15.8f), new Color(0.8f, 0.02f, 0.02f), 1.5f, 6);

        CreatePointLight("Corridor_BlueGuideLight_Area", new Vector3(0, 1.2f, 27), new Color(0.05f, 0.25f, 1f), 1.1f, 10);
        CreatePointLight("SoftwareLab_MonitorColdLight", new Vector3(13.5f, 2.3f, 33), new Color(0.70f, 0.85f, 1f), 1.8f, 8);
        CreatePointLight("SoftwareLab_RedEmergencyLight", new Vector3(18, 3.5f, 30), new Color(0.8f, 0.02f, 0.02f), 1.3f, 7);
    }

    private void CreatePointLight(string name, Vector3 position, Color color, float intensity, float range)
    {
        GameObject obj = new GameObject(name);
        obj.transform.SetParent(root);
        obj.transform.position = position;

        Light light = obj.AddComponent<Light>();
        light.type = LightType.Point;
        light.color = color;
        light.intensity = intensity;
        light.range = range;
    }

    private void CreateCamera()
    {
        GameObject oldCamera = GameObject.Find("Main Camera");
        if (oldCamera != null)
        {
            if (Application.isPlaying)
                Destroy(oldCamera);
            else
                DestroyImmediate(oldCamera);
        }

        GameObject camObj = new GameObject("Main Camera");
        camObj.transform.SetParent(root);
        camObj.tag = "MainCamera";
        camObj.transform.position = new Vector3(0, 1.8f, -8.5f);
        camObj.transform.rotation = Quaternion.Euler(0, 0, 0);

        Camera cam = camObj.AddComponent<Camera>();
        cam.fieldOfView = 62;
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.03f, 0.04f, 0.06f);
    }

    private void CreateCoffeeCup(string name, Vector3 pos)
    {
        Cylinder(name + "_Cup", pos, new Vector3(0.18f, 0.18f, 0.18f), whiteMat);
        Cylinder(name + "_Coffee", pos + new Vector3(0, 0.13f, 0), new Vector3(0.15f, 0.02f, 0.15f), coffeeMat);
    }

    private void CreateRadio(string name, Vector3 pos)
    {
        Cube(name + "_Body", pos, new Vector3(0.35f, 0.18f, 0.55f), blackMat);
        Cube(name + "_Screen", pos + new Vector3(0, 0.11f, -0.1f), new Vector3(0.22f, 0.03f, 0.18f), screenMat);
        Cube(name + "_Antenna", pos + new Vector3(0.17f, 0.34f, 0.18f), new Vector3(0.04f, 0.45f, 0.04f), blackMat);
    }

    private void CreateFlashlight(string name, Vector3 pos)
    {
        GameObject f = Cylinder(name + "_Body", pos, new Vector3(0.16f, 0.42f, 0.16f), blackMat);
        f.transform.rotation = Quaternion.Euler(90, 0, 70);
        Sphere(name + "_GlassHead", pos + new Vector3(0.32f, 0.0f, 0.06f), new Vector3(0.22f, 0.22f, 0.22f), screenMat);
    }

    private void CreateChair(string name, Vector3 pos, float yRot)
    {
        GameObject chairRoot = new GameObject(name);
        chairRoot.transform.SetParent(root);
        chairRoot.transform.position = pos;
        chairRoot.transform.rotation = Quaternion.Euler(0, yRot, 0);

        GameObject seat = Cube(name + "_Seat", pos + new Vector3(0, 0.35f, 0), new Vector3(0.9f, 0.16f, 0.85f), blackMat);
        GameObject back = Cube(name + "_Back", pos + new Vector3(0, 0.9f, 0.38f), new Vector3(0.9f, 1.0f, 0.16f), blackMat);
        GameObject leg1 = Cube(name + "_Leg_01", pos + new Vector3(-0.32f, 0.15f, -0.28f), new Vector3(0.08f, 0.45f, 0.08f), metalMat);
        GameObject leg2 = Cube(name + "_Leg_02", pos + new Vector3(0.32f, 0.15f, -0.28f), new Vector3(0.08f, 0.45f, 0.08f), metalMat);
        GameObject leg3 = Cube(name + "_Leg_03", pos + new Vector3(-0.32f, 0.15f, 0.28f), new Vector3(0.08f, 0.45f, 0.08f), metalMat);
        GameObject leg4 = Cube(name + "_Leg_04", pos + new Vector3(0.32f, 0.15f, 0.28f), new Vector3(0.08f, 0.45f, 0.08f), metalMat);

        seat.transform.SetParent(chairRoot.transform);
        back.transform.SetParent(chairRoot.transform);
        leg1.transform.SetParent(chairRoot.transform);
        leg2.transform.SetParent(chairRoot.transform);
        leg3.transform.SetParent(chairRoot.transform);
        leg4.transform.SetParent(chairRoot.transform);
    }

    private void CreateDoor(string name, Vector3 position, float rotationY, string label)
    {
        GameObject door = Cube(name + "_DoorPanel", position, new Vector3(1.8f, 3.0f, 0.16f), darkGlassMat);
        door.transform.rotation = Quaternion.Euler(0, rotationY, 0);

        GameObject frame = Cube(name + "_DoorFrame", position + new Vector3(0, 0.1f, 0), new Vector3(2.05f, 3.25f, 0.12f), metalMat);
        frame.transform.rotation = Quaternion.Euler(0, rotationY, 0);

        GameObject textObj = new GameObject(name + "_Label_" + label);
        textObj.transform.SetParent(root);
        textObj.transform.position = position + new Vector3(0, 1.85f, -0.12f);
        textObj.transform.rotation = Quaternion.Euler(0, 0, 0);

        TextMesh text = textObj.AddComponent<TextMesh>();
        text.text = label;
        text.anchor = TextAnchor.MiddleCenter;
        text.alignment = TextAlignment.Center;
        text.characterSize = 0.22f;
        text.fontSize = 48;
        text.color = Color.white;
    }
}