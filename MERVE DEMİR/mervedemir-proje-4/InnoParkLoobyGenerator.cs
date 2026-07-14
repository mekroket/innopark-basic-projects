using UnityEngine;

[ExecuteAlways]
public class InnoParkLobbyGenerator : MonoBehaviour
{
    [Header("Tek seferlik buton gibi kullan")]
    public bool GenerateNow = false;
    public bool ClearNow = false;

    [Header("Konum")]
    public Vector3 ModelOffset = Vector3.zero;

    [Header("Ölçek")]
    public float LobbyWidth = 30f;
    public float LobbyDepth = 34f;
    public float LobbyHeight = 11f;
    public float MezzanineHeight = 4.6f;

    private const string ROOT_NAME = "INNOPARK_REAL_LOBBY";

    // Materyaller
    Material matFloor;
    Material matWall;
    Material matDarkPanel;
    Material matWood;
    Material matMetal;
    Material matGlass;
    Material matGlassDark;
    Material matRedCarpet;
    Material matWhite;
    Material matBlack;
    Material matLightGrey;
    Material matMarble;
    Material matSignBeige;
    Material matBlue;
    Material matGreen;
    Material matSofaDark;
    Material matSofaPurple;

    private void OnValidate()
    {
        if (GenerateNow)
        {
            GenerateNow = false;
            GenerateLobby();
        }

        if (ClearNow)
        {
            ClearNow = false;
            ClearLobby();
        }
    }

    // --------------------------
    // ANA ÜRETİM
    // --------------------------
    public void GenerateLobby()
    {
        ClearLobby();
        CreateMaterials();

        GameObject root = new GameObject(ROOT_NAME);
        root.transform.SetParent(transform);
        root.transform.localPosition = ModelOffset;
        root.transform.localRotation = Quaternion.identity;
        root.transform.localScale = Vector3.one;

        BuildMainShell(root.transform);
        BuildCeiling(root.transform);
        BuildUpperFloors(root.transform);
        BuildColumns(root.transform);
        BuildCenterMonument(root.transform);
        BuildBackOfficeWalls(root.transform);
        BuildUpperOfficeWalls(root.transform);
        BuildRightGlassFacade(root.transform);
        BuildEntranceGlass(root.transform);
        BuildRightRamp(root.transform);
        BuildStairsAndUpperCorridors(root.transform);
        BuildElevatorZones(root.transform);
        BuildReceptionDesk(root.transform);
        BuildTTOObject(root.transform);
        BuildBenches(root.transform);
        BuildRadiators(root.transform);
        BuildSignBoards(root.transform);

#if UNITY_EDITOR
        UnityEditor.SceneView.RepaintAll();
#endif
    }

    public void ClearLobby()
    {
        Transform old = transform.Find(ROOT_NAME);
        if (old != null)
        {
            if (Application.isPlaying)
                Destroy(old.gameObject);
            else
                DestroyImmediate(old.gameObject);
        }
    }

    // --------------------------
    // MALZEMELER
    // --------------------------
    void CreateMaterials()
    {
        matFloor = MakeMat("Floor", new Color(0.93f, 0.94f, 0.95f), 0.0f, 0.85f);
        matWall = MakeMat("Wall", new Color(0.97f, 0.97f, 0.96f), 0.0f, 0.2f);
        matDarkPanel = MakeMat("DarkPanel", new Color(0.35f, 0.36f, 0.38f), 0.0f, 0.3f);
        matWood = MakeMat("Wood", new Color(0.83f, 0.72f, 0.48f), 0.0f, 0.35f);
        matMetal = MakeMat("Metal", new Color(0.67f, 0.69f, 0.71f), 0.85f, 0.65f);
        matGlass = MakeTransparentMat("Glass", new Color(0.80f, 0.88f, 0.92f, 0.28f), 0.0f, 0.95f);
        matGlassDark = MakeTransparentMat("GlassDark", new Color(0.65f, 0.72f, 0.77f, 0.45f), 0.0f, 0.92f);
        matRedCarpet = MakeMat("Carpet", new Color(0.60f, 0.07f, 0.18f), 0.0f, 0.1f);
        matWhite = MakeMat("White", Color.white, 0.0f, 0.25f);
        matBlack = MakeMat("Black", new Color(0.15f, 0.15f, 0.15f), 0.0f, 0.15f);
        matLightGrey = MakeMat("LightGrey", new Color(0.82f, 0.83f, 0.84f), 0.0f, 0.35f);
        matMarble = MakeMat("Marble", new Color(0.92f, 0.92f, 0.90f), 0.0f, 0.6f);
        matSignBeige = MakeMat("SignBeige", new Color(0.88f, 0.82f, 0.64f), 0.0f, 0.3f);
        matBlue = MakeMat("Blue", new Color(0.12f, 0.35f, 0.78f), 0.0f, 0.2f);
        matGreen = MakeMat("Green", new Color(0.12f, 0.72f, 0.31f), 0.0f, 0.2f);
        matSofaDark = MakeMat("SofaDark", new Color(0.10f, 0.10f, 0.14f), 0.0f, 0.12f);
        matSofaPurple = MakeMat("SofaPurple", new Color(0.25f, 0.08f, 0.35f), 0.0f, 0.12f);
    }

    Material MakeMat(string name, Color color, float metallic, float smoothness)
    {
        Shader shader = Shader.Find("Universal Render Pipeline/Lit");
        if (shader == null) shader = Shader.Find("Standard");

        Material m = new Material(shader);
        m.name = name;

        if (m.HasProperty("_BaseColor")) m.SetColor("_BaseColor", color);
        if (m.HasProperty("_Color")) m.SetColor("_Color", color);
        if (m.HasProperty("_Metallic")) m.SetFloat("_Metallic", metallic);
        if (m.HasProperty("_Smoothness")) m.SetFloat("_Smoothness", smoothness);
        if (m.HasProperty("_Glossiness")) m.SetFloat("_Glossiness", smoothness);

        return m;
    }

    Material MakeTransparentMat(string name, Color color, float metallic, float smoothness)
    {
        Shader shader = Shader.Find("Universal Render Pipeline/Lit");
        if (shader == null) shader = Shader.Find("Standard");

        Material m = new Material(shader);
        m.name = name;

        if (m.HasProperty("_BaseColor")) m.SetColor("_BaseColor", color);
        if (m.HasProperty("_Color")) m.SetColor("_Color", color);

        if (m.HasProperty("_Metallic")) m.SetFloat("_Metallic", metallic);
        if (m.HasProperty("_Smoothness")) m.SetFloat("_Smoothness", smoothness);
        if (m.HasProperty("_Glossiness")) m.SetFloat("_Glossiness", smoothness);

        // URP transparent
        if (m.HasProperty("_Surface")) m.SetFloat("_Surface", 1f);
        if (m.HasProperty("_Blend")) m.SetFloat("_Blend", 0f);
        if (m.HasProperty("_AlphaClip")) m.SetFloat("_AlphaClip", 0f);
        if (m.HasProperty("_ZWrite")) m.SetFloat("_ZWrite", 0f);

        // Standard transparent
        if (m.HasProperty("_Mode")) m.SetFloat("_Mode", 3f);

        m.renderQueue = 3000;

        return m;
    }

    // --------------------------
    // ANA HACİM
    // --------------------------
    void BuildMainShell(Transform parent)
    {
        // Zemin
        CreateBox("Floor", parent, new Vector3(0, -0.05f, 0), new Vector3(LobbyWidth, 0.1f, LobbyDepth), matFloor);

        // Arka duvar
        CreateBox("BackWall", parent, new Vector3(0, LobbyHeight * 0.5f, 14.8f), new Vector3(LobbyWidth, LobbyHeight, 0.35f), matWall);

        // Sol duvar
        CreateBox("LeftWall", parent, new Vector3(-14.85f, LobbyHeight * 0.5f, 0), new Vector3(0.35f, LobbyHeight, LobbyDepth - 4f), matWall);

        // Sağ duvarın arka bölümü (ön taraf cam olacak)
        CreateBox("RightBackWall", parent, new Vector3(14.85f, LobbyHeight * 0.5f, 8f), new Vector3(0.35f, LobbyHeight, 14f), matWall);

        // Ön üst lento
        CreateBox("FrontTopFrame", parent, new Vector3(0, 8.9f, -16.0f), new Vector3(LobbyWidth, 1.2f, 0.35f), matWall);

        // Sol ön kolon duvar parçası
        CreateBox("FrontLeftWallPart", parent, new Vector3(-12.5f, 4.2f, -16.0f), new Vector3(5f, 8.4f, 0.35f), matWall);

        // Tavan alt beyaz kuşak
        CreateBox("TopPerimeterBand_Back", parent, new Vector3(0, 9.8f, 14.5f), new Vector3(LobbyWidth, 0.25f, 0.6f), matWall);
        CreateBox("TopPerimeterBand_Left", parent, new Vector3(-14.6f, 9.8f, 0), new Vector3(0.6f, 0.25f, LobbyDepth - 4f), matWall);
        CreateBox("TopPerimeterBand_Right", parent, new Vector3(14.6f, 9.8f, 8f), new Vector3(0.6f, 0.25f, 14f), matWall);
    }

    void BuildCeiling(Transform parent)
    {
        // Ana tavan plakası
        CreateBox("CeilingBase", parent, new Vector3(0, 10.1f, 0), new Vector3(LobbyWidth, 0.15f, LobbyDepth), matWhite);

        // Kare grid görünümü
        for (float x = -LobbyWidth / 2f; x <= LobbyWidth / 2f; x += 2f)
        {
            CreateBox("CeilingLine_X_" + x.ToString("F1"), parent,
                new Vector3(x, 10.02f, 0),
                new Vector3(0.03f, 0.02f, LobbyDepth),
                matLightGrey);
        }

        for (float z = -LobbyDepth / 2f; z <= LobbyDepth / 2f; z += 2f)
        {
            CreateBox("CeilingLine_Z_" + z.ToString("F1"), parent,
                new Vector3(0, 10.02f, z),
                new Vector3(LobbyWidth, 0.02f, 0.03f),
                matLightGrey);
        }

        // Tavan ışıkları
        float[] lightXs = { -8f, -4f, 0f, 4f, 8f };
        float[] lightZs = { -9f, -3f, 3f, 9f };

        foreach (float x in lightXs)
        {
            foreach (float z in lightZs)
            {
                CreateBox("CeilingLight", parent,
                    new Vector3(x, 9.97f, z),
                    new Vector3(0.6f, 0.02f, 0.6f),
                    matWhite);
            }
        }
    }

    void BuildUpperFloors(Transform parent)
    {
        // Üst galeri katları
        CreateBox("UpperFloor_Back", parent, new Vector3(0, MezzanineHeight, 9.8f), new Vector3(24f, 0.25f, 3.2f), matWall);
        CreateBox("UpperFloor_Left", parent, new Vector3(-10.5f, MezzanineHeight, 1.5f), new Vector3(3.2f, 0.25f, 13.5f), matWall);
        CreateBox("UpperFloor_Right", parent, new Vector3(10.5f, MezzanineHeight, 1.5f), new Vector3(3.2f, 0.25f, 13.5f), matWall);

        // Alt yüzeyler
        CreateBox("UpperUnderside_Back", parent, new Vector3(0, MezzanineHeight - 0.18f, 9.8f), new Vector3(24f, 0.06f, 3.2f), matLightGrey);
        CreateBox("UpperUnderside_Left", parent, new Vector3(-10.5f, MezzanineHeight - 0.18f, 1.5f), new Vector3(3.2f, 0.06f, 13.5f), matLightGrey);
        CreateBox("UpperUnderside_Right", parent, new Vector3(10.5f, MezzanineHeight - 0.18f, 1.5f), new Vector3(3.2f, 0.06f, 13.5f), matLightGrey);

        // İç kenar cam korkulukları
        CreateRailingLine(parent, new Vector3(-6.5f, MezzanineHeight + 0.55f, 8.15f), new Vector3(6.5f, MezzanineHeight + 0.55f, 8.15f));
        CreateRailingLine(parent, new Vector3(-8.95f, MezzanineHeight + 0.55f, -4.8f), new Vector3(-8.95f, MezzanineHeight + 0.55f, 6.7f));
        CreateRailingLine(parent, new Vector3(8.95f, MezzanineHeight + 0.55f, -4.8f), new Vector3(8.95f, MezzanineHeight + 0.55f, 6.7f));

        // Dış taraf cam korkuluklar
        CreateRailingLine(parent, new Vector3(-12.0f, MezzanineHeight + 0.55f, 8.9f), new Vector3(12.0f, MezzanineHeight + 0.55f, 8.9f));
        CreateRailingLine(parent, new Vector3(-12.05f, MezzanineHeight + 0.55f, -3.0f), new Vector3(-12.05f, MezzanineHeight + 0.55f, 8.5f));
        CreateRailingLine(parent, new Vector3(12.05f, MezzanineHeight + 0.55f, -3.0f), new Vector3(12.05f, MezzanineHeight + 0.55f, 8.5f));
    }

    void BuildColumns(Transform parent)
    {
        Vector3[] positions =
        {
            new Vector3(-8.0f, 5f, 7.0f),
            new Vector3(-8.0f, 5f, -1.0f),
            new Vector3(-3.5f, 5f, 7.0f),
            new Vector3(-3.5f, 5f, -1.0f),

            new Vector3(3.5f, 5f, 7.0f),
            new Vector3(3.5f, 5f, -1.0f),
            new Vector3(8.0f, 5f, 7.0f),
            new Vector3(8.0f, 5f, -1.0f),
        };

        foreach (var p in positions)
        {
            CreateCylinder("Column", parent, p, new Vector3(0.9f, 5f, 0.9f), matMetal);

            // yatay halka detayları
            CreateCylinder("ColumnBand_Low", parent, p + new Vector3(0, -2.2f, 0), new Vector3(0.92f, 0.06f, 0.92f), matLightGrey);
            CreateCylinder("ColumnBand_Mid", parent, p + new Vector3(0, 0f, 0), new Vector3(0.92f, 0.06f, 0.92f), matLightGrey);
            CreateCylinder("ColumnBand_High", parent, p + new Vector3(0, 2.2f, 0), new Vector3(0.92f, 0.06f, 0.92f), matLightGrey);
        }
    }

    // --------------------------
    // ORTA INNOPARK ANIT ALANI
    // --------------------------
    void BuildCenterMonument(Transform parent)
    {
        // Basamaklar (yarım daire etkisi için üst üste dairesel basamaklar)
        CreateCylinder("Step_01", parent, new Vector3(0, 0.16f, 0.5f), new Vector3(8.8f, 0.16f, 5.8f), matMarble);
        CreateCylinder("Step_02", parent, new Vector3(0, 0.36f, 0.9f), new Vector3(7.8f, 0.16f, 5.0f), matMarble);
        CreateCylinder("Step_03", parent, new Vector3(0, 0.56f, 1.25f), new Vector3(6.8f, 0.16f, 4.2f), matMarble);

        // Orta koyu panel
        CreateBox("CenterPanel", parent, new Vector3(0, 4.9f, 1.9f), new Vector3(3.4f, 8.6f, 0.5f), matDarkPanel);

        // Üst açık ahşap bant
        CreateBox("TopWoodBand", parent, new Vector3(0, 5.8f, 1.55f), new Vector3(4.5f, 0.55f, 0.95f), matWood);

        // Yazı plakası
        CreateBox("InnoParkPlaque", parent, new Vector3(0, 4.0f, 1.5f), new Vector3(2.8f, 1.15f, 0.35f), matSignBeige);
        CreateText3D("InnoParkText", parent, "InnoPark", new Vector3(0, 4.0f, 1.29f), new Vector3(0, 180f, 0), 0.22f, matWhite, TextAnchor.MiddleCenter);

        // Alt dekor panel
        CreateBox("LowerDecorBase", parent, new Vector3(0, 2.55f, 1.52f), new Vector3(3.3f, 0.95f, 0.35f), matWood);
        CreateBox("LowerDecorBack", parent, new Vector3(0, 2.55f, 1.58f), new Vector3(2.8f, 0.72f, 0.12f), matDarkPanel);

        GameObject whiteTri = CreateBox("LowerWhiteTri", parent, new Vector3(0.35f, 2.52f, 1.35f), new Vector3(2.2f, 0.55f, 0.08f), matWhite);
        whiteTri.transform.localRotation = Quaternion.Euler(0, 0, -10f);

        // Turnike benzeri giriş elemanları
        BuildTurnstileSet(parent, new Vector3(-2.2f, 1.05f, 2.6f));
        BuildTurnstileSet(parent, new Vector3(2.2f, 1.05f, 2.6f));

        // Kırmızı halı
        CreateBox("RedCarpet", parent, new Vector3(0, 0.015f, -8.5f), new Vector3(2.2f, 0.03f, 13.0f), matRedCarpet);
    }

    void BuildTurnstileSet(Transform parent, Vector3 center)
    {
        CreateBox("TurnstileBase_L", parent, center + new Vector3(-0.35f, 0, 0), new Vector3(0.35f, 1.0f, 0.35f), matLightGrey);
        CreateBox("TurnstileBase_R", parent, center + new Vector3(0.35f, 0, 0), new Vector3(0.35f, 1.0f, 0.35f), matLightGrey);
        CreateBox("TurnstileBar", parent, center + new Vector3(0, 1.0f, 0), new Vector3(0.9f, 0.03f, 0.03f), matMetal);
        CreateBox("TurnstileGlass_L", parent, center + new Vector3(-0.6f, 0.65f, 0), new Vector3(0.04f, 1.0f, 1.0f), matGlass);
        CreateBox("TurnstileGlass_R", parent, center + new Vector3(0.6f, 0.65f, 0), new Vector3(0.04f, 1.0f, 1.0f), matGlass);
    }

    // --------------------------
    // OFİS CEPHELERİ
    // --------------------------
    void BuildBackOfficeWalls(Transform parent)
    {
        // alt kat arka cam ofisler
        for (int i = 0; i < 6; i++)
        {
            float x = -11.0f + i * 4.4f;
            if (x > -2f && x < 2f) continue; // orta anıtın arkasını boş bırak

            BuildOfficeModule(parent, new Vector3(x, 1.8f, 13.6f), 3.6f, 3.0f, true);
        }
    }

    void BuildUpperOfficeWalls(Transform parent)
    {
        for (int i = 0; i < 6; i++)
        {
            float x = -11.0f + i * 4.4f;
            if (x > -2f && x < 2f) continue;

            BuildOfficeModuleUpper(parent, new Vector3(x, 6.6f, 13.55f), 3.6f, 2.4f);
        }

        // yan üst ofis hatları
        for (int i = 0; i < 4; i++)
        {
            float z = -1.8f + i * 3.2f;
            BuildSideUpperOffice(parent, new Vector3(-13.3f, 6.5f, z), true);
            BuildSideUpperOffice(parent, new Vector3(13.3f, 6.5f, z), false);
        }
    }

    void BuildOfficeModule(Transform parent, Vector3 center, float width, float height, bool includeDoor)
    {
        // çerçeve
        CreateBox("OfficeTop", parent, center + new Vector3(0, height * 0.5f - 0.08f, 0), new Vector3(width, 0.16f, 0.12f), matLightGrey);
        CreateBox("OfficeBottom", parent, center + new Vector3(0, -height * 0.5f + 0.08f, 0), new Vector3(width, 0.16f, 0.12f), matLightGrey);
        CreateBox("OfficeSide_L", parent, center + new Vector3(-width * 0.5f + 0.08f, 0, 0), new Vector3(0.16f, height, 0.12f), matLightGrey);
        CreateBox("OfficeSide_R", parent, center + new Vector3(width * 0.5f - 0.08f, 0, 0), new Vector3(0.16f, height, 0.12f), matLightGrey);

        // cam
        CreateBox("OfficeGlass", parent, center, new Vector3(width - 0.25f, height - 0.25f, 0.05f), matGlassDark);

        if (includeDoor)
        {
            CreateBox("OfficeDoor", parent, center + new Vector3(0, -0.15f, -0.02f), new Vector3(1.0f, 2.1f, 0.06f), matGlass);
            CreateBox("OfficeDoorHandle", parent, center + new Vector3(0.35f, -0.1f, -0.04f), new Vector3(0.05f, 0.25f, 0.02f), matMetal);
        }
    }

    void BuildOfficeModuleUpper(Transform parent, Vector3 center, float width, float height)
    {
        CreateBox("UpperOfficeTop", parent, center + new Vector3(0, height * 0.5f - 0.08f, 0), new Vector3(width, 0.16f, 0.12f), matLightGrey);
        CreateBox("UpperOfficeBottom", parent, center + new Vector3(0, -height * 0.5f + 0.08f, 0), new Vector3(width, 0.16f, 0.12f), matLightGrey);
        CreateBox("UpperOfficeSide_L", parent, center + new Vector3(-width * 0.5f + 0.08f, 0, 0), new Vector3(0.16f, height, 0.12f), matLightGrey);
        CreateBox("UpperOfficeSide_R", parent, center + new Vector3(width * 0.5f - 0.08f, 0, 0), new Vector3(0.16f, height, 0.12f), matLightGrey);
        CreateBox("UpperOfficeGlass", parent, center, new Vector3(width - 0.25f, height - 0.25f, 0.05f), matGlassDark);
    }

    void BuildSideUpperOffice(Transform parent, Vector3 center, bool left)
    {
        CreateBox("SideUpperPanel", parent, center, new Vector3(0.08f, 2.2f, 2.4f), matGlassDark);
        CreateBox("SideUpperFrameV1", parent, center + new Vector3(0, 0, -1.15f), new Vector3(0.10f, 2.2f, 0.12f), matLightGrey);
        CreateBox("SideUpperFrameV2", parent, center + new Vector3(0, 0, 1.15f), new Vector3(0.10f, 2.2f, 0.12f), matLightGrey);
        CreateBox("SideUpperFrameTop", parent, center + new Vector3(0, 1.05f, 0), new Vector3(0.10f, 0.12f, 2.4f), matLightGrey);
        CreateBox("SideUpperFrameBot", parent, center + new Vector3(0, -1.05f, 0), new Vector3(0.10f, 0.12f, 2.4f), matLightGrey);
    }

    // --------------------------
    // SAĞ CAM CEPHE
    // --------------------------
    void BuildRightGlassFacade(Transform parent)
    {
        float x = 13.8f;

        // Dikey ana çerçeveler
        for (float z = -14f; z <= 5f; z += 3.0f)
        {
            CreateBox("RightGlassFrameV", parent, new Vector3(x, 5.0f, z), new Vector3(0.12f, 10f, 0.18f), matLightGrey);
        }

        // Yatay kuşaklar
        for (float y = 1.0f; y <= 9.0f; y += 2.0f)
        {
            CreateBox("RightGlassFrameH", parent, new Vector3(x, y, -4.5f), new Vector3(0.12f, 0.12f, 19.0f), matLightGrey);
        }

        // Cam paneller
        for (float y = 1f; y < 9f; y += 2f)
        {
            for (float z = -12.5f; z <= 3.5f; z += 3.0f)
            {
                CreateBox("RightGlassPanel", parent, new Vector3(13.72f, y, z), new Vector3(0.04f, 1.7f, 2.6f), matGlass);
            }
        }

        // Sağ ön üçgenimsi taşıyıcı hissi
        CreateBox("RightWindowDiagonal_01", parent, new Vector3(12.9f, 3.8f, -10.3f), new Vector3(0.18f, 7.5f, 0.18f), matWall, new Vector3(0, 0, -18f));
        CreateBox("RightWindowDiagonal_02", parent, new Vector3(12.9f, 3.8f, -5.0f), new Vector3(0.18f, 7.5f, 0.18f), matWall, new Vector3(0, 0, -18f));
        CreateBox("RightWindowDiagonal_03", parent, new Vector3(12.9f, 3.8f, 0.3f), new Vector3(0.18f, 7.5f, 0.18f), matWall, new Vector3(0, 0, -18f));
    }

    void BuildEntranceGlass(Transform parent)
    {
        // Ön giriş camları
        CreateBox("EntranceGlassMain", parent, new Vector3(0, 4.2f, -15.85f), new Vector3(8.0f, 7.8f, 0.05f), matGlass);
        CreateBox("EntranceFrameTop", parent, new Vector3(0, 8.1f, -15.82f), new Vector3(8.2f, 0.16f, 0.12f), matLightGrey);
        CreateBox("EntranceFrameBottom", parent, new Vector3(0, 0.2f, -15.82f), new Vector3(8.2f, 0.16f, 0.12f), matLightGrey);

        for (float x = -4f; x <= 4f; x += 2f)
        {
            CreateBox("EntranceFrameV", parent, new Vector3(x, 4.1f, -15.82f), new Vector3(0.12f, 7.8f, 0.12f), matLightGrey);
        }

        // kapılar
        CreateBox("Door_Left", parent, new Vector3(-1.0f, 1.5f, -15.80f), new Vector3(1.7f, 3.0f, 0.06f), matGlass);
        CreateBox("Door_Right", parent, new Vector3(1.0f, 1.5f, -15.80f), new Vector3(1.7f, 3.0f, 0.06f), matGlass);
    }

    // --------------------------
    // RAMPA, KORKULUK
    // --------------------------
    void BuildRightRamp(Transform parent)
    {
        // rampa
        CreateBox("Ramp", parent, new Vector3(11.2f, 1.1f, -8.7f), new Vector3(3.2f, 0.22f, 7.0f), matFloor, new Vector3(-10f, 0, 0));

        // yan korkuluklar
        CreateRailingLine(parent, new Vector3(10.1f, 1.65f, -11.6f), new Vector3(10.1f, 2.85f, -5.8f));
        CreateRailingLine(parent, new Vector3(12.3f, 1.65f, -11.6f), new Vector3(12.3f, 2.85f, -5.8f));

        // üst bağlantı platformu
        CreateBox("RampTopLanding", parent, new Vector3(11.2f, 2.95f, -5.1f), new Vector3(3.5f, 0.18f, 1.6f), matFloor);
    }

    // --------------------------
    // MERDİVENLER + ÜST KORİDOR
    // --------------------------
    void BuildStairsAndUpperCorridors(Transform parent)
    {
        // merkezi masa/panelin sağ ve soluna yakın iki merdiven
        BuildStraightStair(parent, "LeftStair", new Vector3(-5.6f, 0f, 5.1f), 2.6f, 5.0f, 4.2f, 11, true);
        BuildStraightStair(parent, "RightStair", new Vector3(5.6f, 0f, 5.1f), 2.6f, 5.0f, 4.2f, 11, true);

        // Üstte ofislere giden koridor kolları
        CreateBox("UpperCorridorLeft", parent, new Vector3(-6.8f, MezzanineHeight + 0.02f, 7.3f), new Vector3(5.0f, 0.12f, 2.2f), matWall);
        CreateBox("UpperCorridorRight", parent, new Vector3(6.8f, MezzanineHeight + 0.02f, 7.3f), new Vector3(5.0f, 0.12f, 2.2f), matWall);

        CreateRailingLine(parent, new Vector3(-9.2f, MezzanineHeight + 0.55f, 6.2f), new Vector3(-4.4f, MezzanineHeight + 0.55f, 6.2f));
        CreateRailingLine(parent, new Vector3(4.4f, MezzanineHeight + 0.55f, 6.2f), new Vector3(9.2f, MezzanineHeight + 0.55f, 6.2f));
    }

    void BuildElevatorZones(Transform parent)
    {
        // sol ve sağ arka tarafta asansör alanları
        BuildElevator(parent, new Vector3(-11.3f, 1.5f, 10.7f), "ElevatorLeft");
        BuildElevator(parent, new Vector3(11.3f, 1.5f, 10.7f), "ElevatorRight");
    }

    void BuildElevator(Transform parent, Vector3 pos, string name)
    {
        GameObject root = new GameObject(name);
        root.transform.SetParent(parent);
        root.transform.localPosition = pos;
        root.transform.localRotation = Quaternion.identity;
        root.transform.localScale = Vector3.one;

        CreateBox("ElevatorFrame", root.transform, Vector3.zero, new Vector3(2.2f, 3.2f, 0.4f), matWall);
        CreateBox("ElevatorDoorL", root.transform, new Vector3(-0.45f, 0, -0.08f), new Vector3(0.75f, 2.3f, 0.06f), matMetal);
        CreateBox("ElevatorDoorR", root.transform, new Vector3(0.45f, 0, -0.08f), new Vector3(0.75f, 2.3f, 0.06f), matMetal);
        CreateBox("ElevatorTopPanel", root.transform, new Vector3(0, 1.35f, -0.09f), new Vector3(1.6f, 0.18f, 0.04f), matBlack);
        CreateBox("ElevatorButton", root.transform, new Vector3(1.0f, 0.4f, -0.12f), new Vector3(0.08f, 0.18f, 0.02f), matBlue);
    }

    // --------------------------
    // MASA / TTO / KOLTUK / LEVHA
    // --------------------------
    void BuildReceptionDesk(Transform parent)
    {
        // 5. fotoğrafa yakın yanda duran masa
        GameObject desk = new GameObject("ReceptionDeskSide");
        desk.transform.SetParent(parent);
        desk.transform.localPosition = new Vector3(5.4f, 0.75f, -5.4f);
        desk.transform.localRotation = Quaternion.identity;
        desk.transform.localScale = Vector3.one;

        CreateBox("Top", desk.transform, Vector3.zero, new Vector3(3.4f, 0.10f, 1.2f), matWood);
        CreateBox("LeftSide", desk.transform, new Vector3(-1.6f, -0.35f, 0), new Vector3(0.18f, 0.8f, 1.1f), matBlack);
        CreateBox("Back", desk.transform, new Vector3(0, -0.35f, 0.48f), new Vector3(3.0f, 0.8f, 0.12f), matBlack);
        CreateBox("DrawerBlock", desk.transform, new Vector3(1.2f, -0.35f, 0), new Vector3(0.65f, 0.72f, 0.95f), matLightGrey);

        CreateBox("Drawer1", desk.transform, new Vector3(1.2f, -0.12f, -0.2f), new Vector3(0.52f, 0.12f, 0.24f), matWhite);
        CreateBox("Drawer2", desk.transform, new Vector3(1.2f, -0.34f, -0.2f), new Vector3(0.52f, 0.12f, 0.24f), matWhite);
        CreateBox("Drawer3", desk.transform, new Vector3(1.2f, -0.56f, -0.2f), new Vector3(0.52f, 0.12f, 0.24f), matWhite);
    }

    void BuildTTOObject(Transform parent)
    {
        GameObject tto = new GameObject("TTO_Sign");
        tto.transform.SetParent(parent);
        tto.transform.localPosition = new Vector3(8.8f, 0.55f, -10.8f);
        tto.transform.localRotation = Quaternion.identity;
        tto.transform.localScale = Vector3.one;

        CreateBox("BaseBlue", tto.transform, new Vector3(0, -0.25f, 0), new Vector3(2.6f, 0.5f, 0.4f), matBlue);
        CreateBox("TopWhite", tto.transform, new Vector3(-0.7f, 0.2f, 0), new Vector3(0.7f, 0.4f, 0.12f), matWhite);

        CreateText3D("TTOText", tto.transform, "TTO", new Vector3(0.55f, 0.2f, -0.08f), new Vector3(0, 180f, 0), 0.28f, matGreen, TextAnchor.MiddleCenter);
        CreateText3D("InnoParkText", tto.transform, "InnoPark", new Vector3(0f, -0.22f, -0.08f), new Vector3(0, 180f, 0), 0.18f, matWhite, TextAnchor.MiddleCenter);
    }

    void BuildBenches(Transform parent)
    {
        BuildBench(parent, new Vector3(9.5f, 0.35f, -1.2f), matSofaDark);
        BuildBench(parent, new Vector3(11.6f, 0.35f, -1.2f), matSofaPurple);
    }

    void BuildBench(Transform parent, Vector3 pos, Material seatMat)
    {
        GameObject b = new GameObject("Bench");
        b.transform.SetParent(parent);
        b.transform.localPosition = pos;
        b.transform.localRotation = Quaternion.identity;
        b.transform.localScale = Vector3.one;

        CreateBox("Seat", b.transform, Vector3.zero, new Vector3(1.8f, 0.45f, 0.8f), seatMat);
        CreateBox("Leg1", b.transform, new Vector3(-0.7f, -0.25f, -0.25f), new Vector3(0.08f, 0.28f, 0.08f), matMetal);
        CreateBox("Leg2", b.transform, new Vector3(0.7f, -0.25f, -0.25f), new Vector3(0.08f, 0.28f, 0.08f), matMetal);
        CreateBox("Leg3", b.transform, new Vector3(-0.7f, -0.25f, 0.25f), new Vector3(0.08f, 0.28f, 0.08f), matMetal);
        CreateBox("Leg4", b.transform, new Vector3(0.7f, -0.25f, 0.25f), new Vector3(0.08f, 0.28f, 0.08f), matMetal);
    }

    void BuildRadiators(Transform parent)
    {
        CreateBox("Radiator_BackLeft", parent, new Vector3(-10.4f, 0.55f, 11.8f), new Vector3(2.2f, 0.8f, 0.12f), matWhite);
        CreateBox("Radiator_BackRight", parent, new Vector3(10.4f, 0.55f, 11.8f), new Vector3(2.2f, 0.8f, 0.12f), matWhite);
        CreateBox("Radiator_Right1", parent, new Vector3(13.3f, 0.55f, -11.5f), new Vector3(0.12f, 0.8f, 2.6f), matWhite);
    }

    void BuildSignBoards(Transform parent)
    {
        // Duvardaki yön panosu
        CreateBox("WallBoard_Right", parent, new Vector3(11.2f, 2.1f, 8.8f), new Vector3(1.2f, 2.2f, 0.08f), matWhite);
        CreateText3D("WallBoard_Text", parent, "KONYA\nSANAYI ODASI", new Vector3(11.2f, 2.15f, 8.65f), new Vector3(0, 180f, 0), 0.10f, matBlue, TextAnchor.MiddleCenter);

        // Sol tarafta uzun dikey banner hissi
        CreateBox("LeftTallBanner", parent, new Vector3(-13.8f, 3.8f, -10.4f), new Vector3(0.08f, 5.8f, 1.2f), matWhite);
        CreateText3D("LeftTallBannerText", parent, "Araştırma Bölgesi", new Vector3(-13.65f, 3.8f, -10.4f), new Vector3(0, 90f, 90f), 0.13f, matBlue, TextAnchor.MiddleCenter);
    }

    // --------------------------
    // YARDIMCILAR
    // --------------------------
    GameObject CreateBox(string name, Transform parent, Vector3 localPos, Vector3 localScale, Material mat)
    {
        return CreateBox(name, parent, localPos, localScale, mat, Vector3.zero);
    }

    GameObject CreateBox(string name, Transform parent, Vector3 localPos, Vector3 localScale, Material mat, Vector3 localRot)
    {
        GameObject go = GameObject.CreatePrimitive(PrimitiveType.Cube);
        go.name = name;
        go.transform.SetParent(parent);
        go.transform.localPosition = localPos;
        go.transform.localRotation = Quaternion.Euler(localRot);
        go.transform.localScale = localScale;

        Renderer r = go.GetComponent<Renderer>();
        if (r != null) r.sharedMaterial = mat;

        return go;
    }

    GameObject CreateCylinder(string name, Transform parent, Vector3 localPos, Vector3 localScale, Material mat)
    {
        GameObject go = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        go.name = name;
        go.transform.SetParent(parent);
        go.transform.localPosition = localPos;
        go.transform.localRotation = Quaternion.identity;
        go.transform.localScale = localScale;

        Renderer r = go.GetComponent<Renderer>();
        if (r != null) r.sharedMaterial = mat;

        return go;
    }

    GameObject CreateText3D(string name, Transform parent, string text, Vector3 localPos, Vector3 localRot, float characterSize, Material mat, TextAnchor anchor)
    {
        GameObject go = new GameObject(name);
        go.transform.SetParent(parent);
        go.transform.localPosition = localPos;
        go.transform.localRotation = Quaternion.Euler(localRot);
        go.transform.localScale = Vector3.one;

        TextMesh tm = go.AddComponent<TextMesh>();
        tm.text = text;
        tm.fontSize = 120;
        tm.characterSize = characterSize;
        tm.anchor = anchor;
        tm.alignment = TextAlignment.Center;
        tm.color = Color.white;

        MeshRenderer mr = go.GetComponent<MeshRenderer>();
        if (mr != null) mr.sharedMaterial = mat;

        return go;
    }

    void CreateRailingLine(Transform parent, Vector3 start, Vector3 end)
    {
        GameObject root = new GameObject("Railing");
        root.transform.SetParent(parent);
        root.transform.localPosition = Vector3.zero;
        root.transform.localRotation = Quaternion.identity;

        Vector3 dir = end - start;
        float len = dir.magnitude;
        Vector3 mid = (start + end) * 0.5f;
        Quaternion rot = Quaternion.LookRotation(dir.normalized, Vector3.up);

        // üst metal korkuluk
        GameObject rail = CreateBox("TopRail", root.transform, mid, new Vector3(0.08f, 0.08f, len), matMetal);
        rail.transform.rotation = rot;

        // alt cam
        GameObject glass = CreateBox("Glass", root.transform, mid + Vector3.down * 0.42f, new Vector3(0.04f, 0.85f, len - 0.15f), matGlassDark);
        glass.transform.rotation = rot;

        // direkler
        int postCount = Mathf.Max(2, Mathf.RoundToInt(len / 1.6f));
        for (int i = 0; i <= postCount; i++)
        {
            float t = (float)i / postCount;
            Vector3 p = Vector3.Lerp(start, end, t);
            CreateBox("Post", root.transform, p + Vector3.down * 0.42f, new Vector3(0.06f, 0.85f, 0.06f), matMetal);
        }
    }

    void BuildStraightStair(Transform parent, string name, Vector3 startPos, float width, float run, float rise, int stepCount, bool towardBack)
    {
        GameObject stairRoot = new GameObject(name);
        stairRoot.transform.SetParent(parent);
        stairRoot.transform.localPosition = startPos;
        stairRoot.transform.localRotation = Quaternion.identity;
        stairRoot.transform.localScale = Vector3.one;

        float stepDepth = run / stepCount;
        float stepHeight = rise / stepCount;

        for (int i = 0; i < stepCount; i++)
        {
            float y = (i + 0.5f) * stepHeight;
            float z = (i + 0.5f) * stepDepth;
            if (!towardBack) z = -z;

            CreateBox("Step_" + i, stairRoot.transform,
                new Vector3(0, y * 0.5f, z),
                new Vector3(width, stepHeight * (i + 1), stepDepth),
                matMarble);
        }

        // yan korkuluklar
        CreateRailingLine(stairRoot.transform,
            new Vector3(-width * 0.55f, 1.0f, 0.2f),
            new Vector3(-width * 0.55f, rise + 1.0f, towardBack ? run : -run));

        CreateRailingLine(stairRoot.transform,
            new Vector3(width * 0.55f, 1.0f, 0.2f),
            new Vector3(width * 0.55f, rise + 1.0f, towardBack ? run : -run));
    }
}